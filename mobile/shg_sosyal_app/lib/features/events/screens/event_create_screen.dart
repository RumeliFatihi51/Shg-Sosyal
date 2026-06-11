import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/auth/role_permissions.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../data/models/user_model.dart';
import '../../auth/providers/auth_providers.dart';
import '../providers/event_providers.dart';

class EventCreateScreen extends ConsumerStatefulWidget {
  const EventCreateScreen({super.key});

  @override
  ConsumerState<EventCreateScreen> createState() => _EventCreateScreenState();
}

class _EventCreateScreenState extends ConsumerState<EventCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _location = TextEditingController();
  final _date = TextEditingController();
  final _time = TextEditingController(text: '15:00');
  final _capacity = TextEditingController();
  String _category = 'Atölye';
  bool _isSubmitting = false;
  XFile? _pickedImage;

  @override
  void initState() {
    super.initState();
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    _date.text =
        '${tomorrow.year.toString().padLeft(4, '0')}-${tomorrow.month.toString().padLeft(2, '0')}-${tomorrow.day.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _location.dispose();
    _date.dispose();
    _time.dispose();
    _capacity.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final user = ref.read(authControllerProvider).valueOrNull;
    final needsApproval = RolePermissions.eventNeedsApproval(user);
    final startsAt =
        DateTime.tryParse('${_date.text.trim()}T${_time.text.trim()}:00');

    if (startsAt == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tarih ve saat formatını kontrol et.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final imageBytes = await _pickedImage?.readAsBytes();
      await ref.read(eventActionControllerProvider.notifier).createEvent(
            title: _title.text.trim(),
            description: _description.text.trim(),
            location: _location.text.trim(),
            startsAt: startsAt,
            capacity: int.tryParse(_capacity.text.trim()),
            category: _category,
            imageBytes: imageBytes,
            imageMimeType: _pickedImage?.mimeType,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            needsApproval
                ? 'Etkinlik önerin admin onayına gönderildi.'
                : 'Etkinlik yayınlandı.',
          ),
        ),
      );
      context.pop();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Etkinlik oluşturulamadı: $error')),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authControllerProvider).valueOrNull;
    final needsApproval = RolePermissions.eventNeedsApproval(user);

    return Scaffold(
      appBar: AppBar(
          title: Text(needsApproval ? 'Etkinlik öner' : 'Etkinlik yayınla')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 96),
          children: [
            _FormIntro(
              title: needsApproval
                  ? 'Okul takvimine yeni etkinlik öner'
                  : 'Etkinliği okul akışına yayınla',
              body: needsApproval
                  ? 'Etkinlikler admin onayından sonra okul akışında görünür.'
                  : 'Admin ve öğretmen etkinlikleri onay beklemeden yayınlanır.',
              badge: RolePermissions.label(user?.role ?? UserRole.student),
            ),
            const SizedBox(height: 16),
            AppTextField(
                label: 'Başlık',
                controller: _title,
                validator: Validators.required),
            const SizedBox(height: 12),
            AppTextField(
              label: 'Açıklama',
              controller: _description,
              validator: Validators.required,
              maxLines: 4,
            ),
            const SizedBox(height: 12),
            AppTextField(
                label: 'Konum',
                controller: _location,
                validator: Validators.required),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _category,
              decoration: const InputDecoration(labelText: 'Kategori'),
              items: const [
                DropdownMenuItem(value: 'Atölye', child: Text('Atölye')),
                DropdownMenuItem(value: 'Spor', child: Text('Spor')),
                DropdownMenuItem(value: 'Sanat', child: Text('Sanat')),
                DropdownMenuItem(value: 'Bilim', child: Text('Bilim')),
                DropdownMenuItem(value: 'Sosyal', child: Text('Sosyal')),
              ],
              onChanged: (value) =>
                  setState(() => _category = value ?? _category),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: AppTextField(
                    label: 'Tarih',
                    hint: '2026-06-07',
                    controller: _date,
                    validator: Validators.required,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: AppTextField(
                    label: 'Saat',
                    hint: '15:00',
                    controller: _time,
                    validator: Validators.required,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            AppTextField(
              label: 'Kontenjan',
              hint: 'Opsiyonel',
              controller: _capacity,
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            _EventImagePickerPreview(
              image: _pickedImage,
              onPick: _pickImage,
              onRemove: () => setState(() => _pickedImage = null),
            ),
            const SizedBox(height: 20),
            AppButton(
              label: _isSubmitting
                  ? 'Gönderiliyor...'
                  : needsApproval
                      ? 'Onaya gönder'
                      : 'Yayınla',
              expand: true,
              onPressed: _isSubmitting ? null : _submit,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickImage() async {
    final image = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      maxWidth: 1600,
      imageQuality: 82,
    );
    if (image == null) return;
    final size = await image.length();
    if (size > 3 * 1024 * 1024) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Görsel en fazla 3MB olabilir.')),
      );
      return;
    }
    setState(() => _pickedImage = image);
  }
}

class _EventImagePickerPreview extends StatelessWidget {
  const _EventImagePickerPreview({
    required this.image,
    required this.onPick,
    required this.onRemove,
  });

  final XFile? image;
  final VoidCallback onPick;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          const Icon(Icons.image_outlined, color: AppColors.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              image?.name ?? 'Etkinlik görseli ekle',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (image != null)
            IconButton(
              tooltip: 'Kaldır',
              onPressed: onRemove,
              icon: const Icon(Icons.close),
            ),
          OutlinedButton(
            onPressed: onPick,
            child: Text(image == null ? 'Seç' : 'Değiştir'),
          ),
        ],
      ),
    );
  }
}

class _FormIntro extends StatelessWidget {
  const _FormIntro({
    required this.title,
    required this.body,
    required this.badge,
  });

  final String title;
  final String body;
  final String badge;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                  child: Text(title,
                      style: Theme.of(context).textTheme.titleMedium)),
              AppBadge(label: badge, color: AppColors.primary),
            ],
          ),
          const SizedBox(height: 5),
          Text(body, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
