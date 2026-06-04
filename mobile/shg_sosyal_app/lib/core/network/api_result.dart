sealed class ApiResult<T> {
  const ApiResult();

  R when<R>({
    required R Function(T data) success,
    required R Function(String message, Object? error) failure,
  }) {
    final value = this;
    return switch (value) {
      ApiSuccess<T>() => success(value.data),
      ApiFailure<T>() => failure(value.message, value.error),
    };
  }
}

class ApiSuccess<T> extends ApiResult<T> {
  const ApiSuccess(this.data);

  final T data;
}

class ApiFailure<T> extends ApiResult<T> {
  const ApiFailure(this.message, [this.error]);

  final String message;
  final Object? error;
}
