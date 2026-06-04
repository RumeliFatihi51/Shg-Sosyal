import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../providers/event_providers.dart';

class EventDetailScreen extends ConsumerWidget {
  const EventDetailScreen({required this.id, super.key});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final event = ref.watch(eventDetailProvider(id));

    return Scaffold(
      appBar: AppBar(title: const Text('Etkinlik')),
      body: event.when(
        loading: () => const LoadingView(),
        error: (_, __) => const AppEmptyState(title: 'Etkinlik açılmadı.', message: 'Tekrar dene.'),
        data: (item) {
          if (item == null) {
            return const AppEmptyState(title: 'Etkinlik bulunamadı.', message: 'Bu etkinlik kaldırılmış olabilir.');
          }
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(item.title, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text(item.description, style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 18),
              _Info(icon: Icons.schedule, text: DateFormatters.full(item.startsAt)),
              _Info(icon: Icons.location_on_outlined, text: item.location),
              _Info(icon: Icons.groups_2_outlined, text: item.organizerName),
              _Info(icon: Icons.person_outline, text: '${item.participantCount} kişi katılıyor'),
              const SizedBox(height: 18),
              if (item.friendParticipants.isNotEmpty) ...[
                Text('Arkadaşların', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 10),
                Row(
                  children: [
                    for (final friend in item.friendParticipants.take(4)) ...[
                      AppAvatar(name: friend.fullName, size: 34),
                      const SizedBox(width: 6),
                    ],
                  ],
                ),
                const SizedBox(height: 18),
              ],
              AppButton(label: 'Katıl', icon: Icons.check_circle_outline, onPressed: () {}),
              const SizedBox(height: 10),
              AppButton(label: 'İlgileniyorum', outlined: true, onPressed: () {}),
            ],
          );
        },
      ),
    );
  }
}

class _Info extends StatelessWidget {
  const _Info({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}
