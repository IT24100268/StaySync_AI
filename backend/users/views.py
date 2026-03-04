from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User
from .serializers import RegisterSerializer, UserSerializer, PendingUserSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        print(f"✅ User created: {user.username}, Type: {user.user_type}, Approved: {user.is_approved}")
        
        response_data = {
            'user': UserSerializer(user).data,
            'message': 'Registration successful!' if user.is_approved else 'Registration successful. Please wait for admin approval to login.'
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if user is None:
            return Response(
                {'detail': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user is approved
        if not user.is_approved:
            return Response(
                {'detail': 'Account pending admin approval'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user_type': user.user_type,
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff,
            'user': user_data
        })

class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user

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
                'user': UserSerializer(user).data
            })
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
