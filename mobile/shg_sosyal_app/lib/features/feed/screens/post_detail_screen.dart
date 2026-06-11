import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../auth/providers/auth_providers.dart';
import '../providers/feed_providers.dart';
import '../widgets/feed_item_card.dart';

class PostDetailScreen extends ConsumerStatefulWidget {
  const PostDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends ConsumerState<PostDetailScreen> {
  final _comment = TextEditingController();

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final post = ref.watch(postDetailProvider(widget.id));
    final user = ref.watch(authControllerProvider).valueOrNull;

    return Scaffold(
      appBar: AppBar(title: const Text('Gönderi')),
      body: post == null
          ? AppEmptyState(
              title: 'Gönderi bulunamadı.',
              message: 'Bu gönderi silinmiş olabilir.',
              actionLabel: 'Akışa dön',
              onAction: () => context.go('/home'),
            )
          : Column(
              children: [
                Expanded(
                  child: ListView(
                    children: [
                      FeedItemCard(item: post),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                        child: Text(
                          'Yanıtlar',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ),
                      if (post.comments.isEmpty)
                        const Padding(
                          padding: EdgeInsets.all(16),
                          child: Text('Henüz yanıt yok. İlk yorumu sen yaz.'),
                        )
                      else
                        for (final comment in post.comments)
                          Container(
                            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                            decoration: const BoxDecoration(
                              border: Border(
                                bottom: BorderSide(color: AppColors.border),
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                AppAvatar(
                                  name: comment.author.fullName,
                                  size: 36,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              comment.author.fullName,
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .titleSmall,
                                            ),
                                          ),
                                          Text(
                                            DateFormatters.relative(
                                              comment.createdAt,
                                            ),
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodySmall,
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(comment.content),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                    ],
                  ),
                ),
                SafeArea(
                  top: false,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: const BoxDecoration(
                      color: AppColors.background,
                      border: Border(top: BorderSide(color: AppColors.border)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _comment,
                            minLines: 1,
                            maxLines: 4,
                            decoration:
                                const InputDecoration(hintText: 'Yanıt yaz'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        FilledButton(
                          onPressed: user == null
                              ? null
                              : () {
                                  ref
                                      .read(feedControllerProvider.notifier)
                                      .addComment(
                                        postId: post.id,
                                        author: user,
                                        content: _comment.text,
                                      );
                                  _comment.clear();
                                },
                          child: const Text('Yanıtla'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
