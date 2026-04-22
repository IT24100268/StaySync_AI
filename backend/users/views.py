from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User
from .serializers import RegisterSerializer, UserSerializer, PendingUserSerializer
from admin_panel.utils import create_admin_log


def get_effective_role(user):
    if user.is_staff or user.is_superuser:
        return 'administrator'
    return user.user_type


def normalize_coordinate(value, field_name):
    if value in (None, ''):
        return None

    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        raise ValueError('Latitude and longitude must be valid numbers.')

    if field_name == 'latitude' and not (-90 <= numeric_value <= 90):
        raise ValueError('Latitude must be between -90 and 90.')
    if field_name == 'longitude' and not (-180 <= numeric_value <= 180):
        raise ValueError('Longitude must be between -180 and 180.')

    return numeric_value


def sync_restaurant_records(owner, payload):
    """
    Keep the legacy restaurant table aligned with the latest owner profile data.
    The public restaurants table is synced on-demand via sync_legacy_restaurants_and_menu.
    """
    if not payload:
        return

    from restaurant.models import Restaurant as LegacyRestaurant

    restaurant_obj = LegacyRestaurant.objects.filter(owner=owner).order_by('id').first()
    if restaurant_obj is None:
        LegacyRestaurant.objects.create(owner=owner, **{k: v for k, v in payload.items() if k != 'area'})
        return

    update_fields = []
    for field, value in payload.items():
        if field == 'area':
            continue
        if getattr(restaurant_obj, field, None) != value:
            setattr(restaurant_obj, field, value)
            update_fields.append(field)

    if update_fields:
        restaurant_obj.save(update_fields=update_fields)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def create(self, request, *args, **kwargs):
        profile_data = request.data.get('profile')
        extracted_profile_data = {}
        for key in request.data.keys():
            if key.startswith('profile.'):
                extracted_profile_data[key.split('.', 1)[1]] = request.data.get(key)
            elif key.startswith('profile[') and key.endswith(']'):
                extracted_profile_data[key[8:-1]] = request.data.get(key)

        if isinstance(profile_data, dict):
            profile_data = {**profile_data, **extracted_profile_data}
        else:
            profile_data = extracted_profile_data

        display_image = (
            request.FILES.get('profile.display_image')
            or request.FILES.get('profile[display_image]')
            or request.FILES.get('display_image')
        )
        if display_image:
            profile_data['display_image'] = display_image

        payload = {
            'email': request.data.get('email'),
            'username': request.data.get('username'),
            'password': request.data.get('password'),
            'user_type': request.data.get('user_type'),
            'profile': profile_data,
        }

        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        response_data = {
            'user': UserSerializer(user, context={'request': request}).data,
            'message': 'Registration successful!' if user.is_approved else 'Registration successful. Please wait for admin approval to login.'
        }

        create_admin_log(
            actor=user,
            action='User registered',
            target_type='USER',
            target_id=user.id,
            details={
                'user_type': get_effective_role(user),
                'is_approved': user.is_approved,
            }
        )
        
        return Response(response_data, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        print(f"Login attempt - Username: {username}, Password length: {len(password) if password else 0}")
        
        user = authenticate(username=username, password=password)
        
        print(f"Authentication result: {user}")
        
        if user is None:
            print("Authentication failed - Invalid credentials")
            return Response(
                {'detail': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if user.is_blocked and not user.is_superuser and not user.is_staff:
            print(f"User {username} is blocked")
            return Response(
                {
                    'detail': 'Your account has been blocked. Please contact support or the admin team.',
                    'reason': user.block_reason or 'No reason was provided.',
                    'code': 'account_blocked',
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if user is approved
        if not user.is_approved and not user.is_superuser and not user.is_staff:
            print(f"User {username} not approved")
            return Response(
                {'detail': 'Account pending admin approval', 'code': 'account_pending'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        print(f"Login successful for {username}")
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user, context={'request': request}).data

        create_admin_log(
            actor=user,
            action='User logged in',
            target_type='USER',
            target_id=user.id,
            details={'user_type': get_effective_role(user)}
        )

        effective_role = get_effective_role(user)

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user_type': effective_role,
            'effective_role': effective_role,
            'raw_user_type': user.user_type,
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff,
            'user': user_data
        })

class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = request.user
        try:
            restaurant_sync_payload = None
            update_fields = []
            changed_fields = []
            for field in ('username', 'email', 'first_name', 'last_name'):
                if field in request.data:
                    setattr(user, field, request.data[field])
                    update_fields.append(field)
                    changed_fields.append(field)
            if update_fields:
                user.save(update_fields=update_fields)

            profile_data = request.data.get('profile')
            extracted_profile_data = {}
            for key in request.data.keys():
                if key.startswith('profile.'):
                    extracted_profile_data[key.split('.', 1)[1]] = request.data.get(key)
                elif key.startswith('profile[') and key.endswith(']'):
                    extracted_profile_data[key[8:-1]] = request.data.get(key)

            if isinstance(profile_data, dict):
                profile_data = {**profile_data, **extracted_profile_data}
            else:
                profile_data = extracted_profile_data

            if isinstance(profile_data, dict):
                profile_obj = None
                profile_fields = []
                if user.user_type == 'hostel_owner' and hasattr(user, 'hostel_profile'):
                    profile_obj = user.hostel_profile
                    allowed = ('hostel_name', 'address', 'latitude', 'longitude', 'phone_number', 'business_reg_no')
                elif user.user_type == 'restaurant_owner' and hasattr(user, 'restaurant_profile'):
                    profile_obj = user.restaurant_profile
                    allowed = ('restaurant_name', 'area', 'address', 'latitude', 'longitude', 'phone_number')
                elif user.user_type == 'student' and hasattr(user, 'student_profile'):
                    profile_obj = user.student_profile
                    allowed = ('university', 'gender_preference', 'budget', 'phone_number', 'latitude', 'longitude')
                elif user.user_type == 'delivery' and hasattr(user, 'delivery_profile'):
                    profile_obj = user.delivery_profile
                    allowed = ('vehicle_type', 'license_no', 'phone_number')
                else:
                    allowed = ()
                if profile_obj:
                    for f in allowed:
                        if f in profile_data:
                            value = profile_data[f]
                            if f in ('latitude', 'longitude'):
                                value = normalize_coordinate(value, f)
                            setattr(profile_obj, f, value)
                            profile_fields.append(f)
                            changed_fields.append(f'profile.{f}')

                    profile_image = (
                        request.FILES.get('profile.display_image')
                        or request.FILES.get('profile[display_image]')
                        or request.FILES.get('display_image')
                    )
                    remove_profile_image = str(
                        request.data.get('remove_display_image', request.data.get('profile.remove_display_image', ''))
                    ).lower() in ('1', 'true', 'yes')

                    if hasattr(profile_obj, 'display_image'):
                        if remove_profile_image and profile_obj.display_image:
                            profile_obj.display_image.delete(save=False)
                            profile_obj.display_image = None
                            profile_fields.append('display_image')
                            changed_fields.append('profile.display_image')
                        elif profile_image:
                            profile_obj.display_image = profile_image
                            profile_fields.append('display_image')
                            changed_fields.append('profile.display_image')

                    if profile_fields:
                        profile_obj.save(update_fields=list(dict.fromkeys(profile_fields)))

                    if user.user_type == 'restaurant_owner':
                        restaurant_sync_payload = {
                            'name': getattr(profile_obj, 'restaurant_name', '') or user.username,
                            'email': user.email or '',
                            'phone': getattr(profile_obj, 'phone_number', '') or '',
                            'area': getattr(profile_obj, 'area', '') or '',
                            'address': getattr(profile_obj, 'address', '') or '',
                            'latitude': getattr(profile_obj, 'latitude', None),
                            'longitude': getattr(profile_obj, 'longitude', None),
                        }

            if restaurant_sync_payload:
                sync_restaurant_records(user, restaurant_sync_payload)

            if changed_fields:
                create_admin_log(
                    actor=user,
                    action='Profile updated',
                    target_type='USER',
                    target_id=user.id,
                    details={'updated_fields': changed_fields}
                )

            return Response(UserSerializer(user, context={'request': request}).data)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PendingUsersView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = PendingUserSerializer
    
    def get_queryset(self):
        return User.objects.filter(is_approved=False, is_superuser=False).order_by('-date_joined')

class ApproveUserView(APIView):
    permission_classes = [IsAdminUser]
    
    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.is_approved = True
            user.save()
            return Response({
                'message': 'User approved successfully',
                'user': UserSerializer(user, context={'request': request}).data
            })
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
