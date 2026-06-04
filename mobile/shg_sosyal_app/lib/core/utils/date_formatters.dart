import 'package:intl/intl.dart';

class DateFormatters {
  const DateFormatters._();

  static final _time = DateFormat('HH:mm', 'tr_TR');
  static final _dayMonth = DateFormat('d MMM', 'tr_TR');
  static final _full = DateFormat('d MMMM y, HH:mm', 'tr_TR');

  static String time(DateTime value) => _time.format(value);
  static String dayMonth(DateTime value) => _dayMonth.format(value);
  static String full(DateTime value) => _full.format(value);

  static String relative(DateTime value) {
    final diff = DateTime.now().difference(value);
    if (diff.inMinutes < 1) return 'az önce';
    if (diff.inMinutes < 60) return '${diff.inMinutes} dk';
    if (diff.inHours < 24) return '${diff.inHours} sa';
    if (diff.inDays < 7) return '${diff.inDays} gün';
    return dayMonth(value);
  }
}
