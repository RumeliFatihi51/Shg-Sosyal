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
import '../providers/community_providers.dart';

class CommunityCreateScreen extends ConsumerStatefulWidget {
  const CommunityCreateScreen({super.key});

  @override
  ConsumerState<CommunityCreateScreen> createState() =>
      _CommunityCreateScreenState();
}

class _CommunityCreateScreenState extends ConsumerState<CommunityCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _description = TextEditingController();
  String _category = 'Teknoloji';
  bool _isSubmitting = false;
  XFile? _pickedImage;

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final user = ref.read(authControllerProvider).valueOrNull;
    final needsApproval = RolePermissions.communityNeedsApproval(user);
    setState(() => _isSubmitting = true);

    try {
      final imageBytes = await _pickedImage?.readAsBytes();
      await ref.read(communityRepositoryProvider).createCommunity(
            name: _name.text.trim(),
            description: _description.text.trim(),
            category: _category,
            imageBytes: imageBytes,
            imageMimeType: _pickedImage?.mimeType,
          );
      ref.invalidate(communitiesProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            needsApproval
                ? 'Topluluk başvurun admin onayına gönderildi.'
                : 'Topluluk açıldı.',
          ),
        ),
      );
      context.pop();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Topluluk kurulamadı: $error')),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authControllerProvider).valueOrNull;
    final needsApproval = RolePermissions.communityNeedsApproval(user);

    return Scaffold(
      appBar: AppBar(title: const Text('Topluluk kur')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 96),
          children: [
            Container(
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
                        child: Text(
                          needsApproval ? 'Topluluk başvurusu' : 'Topluluğu aç',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ),
                      AppBadge(
                        label: RolePermissions.label(
                            user?.role ?? UserRole.student),
                        color: needsApproval
                            ? AppColors.warning
                            : AppColors.success,
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    needsApproval
                        ? 'Topluluklar admin onayından sonra akışta görünür.'
                        : 'Admin topluluğu onay beklemeden açabilir.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppTextField(
                label: 'Topluluk adı',
                controller: _name,
                validator: Validators.required),
            const SizedBox(height: 12),
            AppTextField(
              label: 'Açıklama',
              controller: _description,
              validator: Validators.required,
              maxLines: 4,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _category,
              decoration: const InputDecoration(labelText: 'Kategori'),
              items: const [
                DropdownMenuItem(value: 'Teknoloji', child: Text('Teknoloji')),
                DropdownMenuItem(value: 'Sanat', child: Text('Sanat')),
                DropdownMenuItem(value: 'Spor', child: Text('Spor')),
                DropdownMenuItem(value: 'Strateji', child: Text('Strateji')),
                DropdownMenuItem(value: 'Müzik', child: Text('Müzik')),
              ],
              onChanged: (value) =>
                  setState(() => _category = value ?? _category),
            ),
            const SizedBox(height: 12),
            _ImagePickerPreview(
              image: _pickedImage,
              onPick: _pickImage,
              onRemove: () => setState(() => _pickedImage = null),
            ),
            const SizedBox(height: 20),
            AppButton(
              label: _isSubmitting
                  ? 'Gönderiliyor...'
                  : needsApproval
                      ? 'Başvuru gönder'
                      : 'Topluluğu aç',
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

class _ImagePickerPreview extends StatelessWidget {
  const _ImagePickerPreview({
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
              image?.name ?? 'Topluluk görseli ekle',
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
