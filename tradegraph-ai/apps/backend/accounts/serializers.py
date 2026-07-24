from django.contrib.auth import authenticate, password_validation
from rest_framework import serializers

from accounts.models import User


class UserSerializer(serializers.ModelSerializer[User]):
    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "role", "date_joined", "updated_at")
        read_only_fields = ("id", "email", "role", "date_joined", "updated_at")


class RegistrationSerializer(serializers.ModelSerializer[User]):
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ("email", "password", "first_name", "last_name")

    def validate_email(self, value: str) -> str:
        return value.lower()

    def validate_password(self, value: str) -> str:
        password_validation.validate_password(value)
        return value

    def create(self, validated_data: dict[str, str]) -> User:
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer[dict[str, str]]):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs: dict[str, str]) -> dict[str, str]:
        user = authenticate(email=attrs["email"].lower(), password=attrs["password"])
        if user is None or not user.is_active:
            raise serializers.ValidationError("Invalid email or password.")
        attrs["user"] = user  # type: ignore[assignment]
        return attrs


class ChangePasswordSerializer(serializers.Serializer[dict[str, str]]):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value: str) -> str:
        password_validation.validate_password(value, self.context["request"].user)
        return value
