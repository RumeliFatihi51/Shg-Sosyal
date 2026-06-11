class Validators {
  const Validators._();

  static String? required(
    String? value, {
    String message = 'Bu alan gerekli.',
  }) {
    if (value == null || value.trim().isEmpty) return message;
    return null;
  }

  static String? email(String? value) {
    final requiredError = required(value, message: 'E-posta gerekli.');
    if (requiredError != null) return requiredError;
    final valid = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value!.trim());
    return valid ? null : 'Geçerli bir e-posta yaz.';
  }

  static String? password(String? value) {
    if ((value ?? '').length < 6) return 'Şifre en az 6 karakter olmalı.';
    return null;
  }
}
