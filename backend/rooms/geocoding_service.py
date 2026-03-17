import requests
from typing import Dict, Optional

class GeocodingService:
    """Service to handle address geocoding using OpenStreetMap Nominatim API"""
    
    NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
    USER_AGENT = "StaySyncAI/1.0"
    
    @classmethod
    def geocode_address(cls, address_data: Dict) -> Dict:
        """
        Convert address to coordinates using Nominatim API
        
        Args:
            address_data: Dictionary containing address fields
            
        Returns:
            Dictionary with success status, coordinates, and detected address
        """
        # Build full address string
        address_parts = [
            address_data.get('address_line_1', ''),
            address_data.get('address_line_2', ''),
            address_data.get('area', ''),
            address_data.get('landmark', ''),
            address_data.get('city', ''),
            address_data.get('postal_code', ''),
            'Sri Lanka'  # Add country for better results
        ]
        
        full_address = ', '.join([part for part in address_parts if part])
        
        if not full_address:
            return {
                'success': False,
                'message': 'Please provide address details'
            }
        
        try:
            # Try full address first
            result = cls._try_geocode(full_address)
            if result:
                return result
            
            # Fallback 1: Try with city and landmark only
            if address_data.get('city') and address_data.get('landmark'):
                fallback_address = f"{address_data['landmark']}, {address_data['city']}, Sri Lanka"
                result = cls._try_geocode(fallback_address)
                if result:
                    return result
            
            # Fallback 2: Try with area and city
            if address_data.get('area') and address_data.get('city'):
                fallback_address = f"{address_data['area']}, {address_data['city']}, Sri Lanka"
                result = cls._try_geocode(fallback_address)
                if result:
                    return result
            
            # Fallback 3: Try city only
            if address_data.get('city'):
                fallback_address = f"{address_data['city']}, Sri Lanka"
                result = cls._try_geocode(fallback_address)
                if result:
                    return result
            
            return {
                'success': False,
                'message': "We couldn't detect the exact location. Please improve the address or add a nearby landmark."
            }
                
        except requests.exceptions.Timeout:
            return {
                'success': False,
                'message': 'Location detection timed out. Please try again.'
            }
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'message': 'Unable to detect location. Please check your internet connection.'
            }
        except Exception as e:
            return {
                'success': False,
                'message': 'An error occurred while detecting location.'
            }
    
    @classmethod
    def _try_geocode(cls, address: str) -> Optional[Dict]:
        """Try to geocode a single address string"""
        try:
            response = requests.get(
                cls.NOMINATIM_URL,
                params={
                    'q': address,
                    'format': 'json',
                    'limit': 1,
                    'countrycodes': 'lk'  # Limit to Sri Lanka
                },
                headers={'User-Agent': cls.USER_AGENT},
                timeout=10
            )
            
            response.raise_for_status()
            data = response.json()
            
            if data and len(data) > 0:
                location = data[0]
                return {
                    'success': True,
                    'message': 'Location found successfully',
                    'latitude': location['lat'],
                    'longitude': location['lon'],
                    'detected_address': location.get('display_name', address)
                }
            return None
        except:
            return None
