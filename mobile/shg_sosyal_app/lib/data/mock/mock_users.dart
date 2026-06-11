import '../models/user_model.dart';

final mockCurrentUser = UserModel(
  id: 'u1',
  fullName: 'Mehmet Eymen Güler',
  username: '@eymen2011',
  email: 'mr.eymen2011@gmail.com',
  className: '9/A',
  bio: 'Robotik, yazılım ve okul etkinlikleri.',
  points: 840,
  role: UserRole.admin,
);

final mockUsers = <UserModel>[
  mockCurrentUser,
  const UserModel(
    id: 'u2',
    fullName: 'Ali Yılmaz',
    username: '@ali.yilmaz',
    email: 'ali@example.com',
    className: '9/A',
    bio: 'Basketbol ve satranç.',
    points: 720,
    role: UserRole.communityAdmin,
  ),
  const UserModel(
    id: 'u3',
    fullName: 'Zeynep Kaya',
    username: '@zeynep9a',
    email: 'zeynep@example.com',
    className: '9/B',
    bio: 'Tiyatro kulübündeyim.',
    points: 690,
    role: UserRole.teacher,
  ),
  const UserModel(
    id: 'u4',
    fullName: 'Efe Demir',
    username: '@efe.demir',
    email: 'efe@example.com',
    className: '10/C',
    bio: 'Yapay zeka ve müzik.',
    points: 610,
    role: UserRole.student,
  ),
  const UserModel(
    id: 'u5',
    fullName: 'Ayşe Arslan',
    username: '@ayse.arslan',
    email: 'ayse@example.com',
    className: '11/A',
    bio: 'Sahne ve Tiyatro ekibi.',
    points: 570,
    role: UserRole.student,
  ),
];
