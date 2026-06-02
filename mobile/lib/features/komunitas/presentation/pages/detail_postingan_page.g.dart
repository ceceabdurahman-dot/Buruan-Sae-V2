// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'detail_postingan_page.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$detailPostinganHash() => r'f392a968ae5c34e8f0afe6b09453f89046180c8b';

/// Copied from Dart SDK
class _SystemHash {
  _SystemHash._();

  static int combine(int hash, int value) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + value);
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
    return hash ^ (hash >> 6);
  }

  static int finish(int hash) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
    // ignore: parameter_assignments
    hash = hash ^ (hash >> 11);
    return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
  }
}

/// See also [detailPostingan].
@ProviderFor(detailPostingan)
const detailPostinganProvider = DetailPostinganFamily();

/// See also [detailPostingan].
class DetailPostinganFamily extends Family<AsyncValue<Map<String, dynamic>>> {
  /// See also [detailPostingan].
  const DetailPostinganFamily();

  /// See also [detailPostingan].
  DetailPostinganProvider call(
    String id,
  ) {
    return DetailPostinganProvider(
      id,
    );
  }

  @override
  DetailPostinganProvider getProviderOverride(
    covariant DetailPostinganProvider provider,
  ) {
    return call(
      provider.id,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'detailPostinganProvider';
}

/// See also [detailPostingan].
class DetailPostinganProvider
    extends AutoDisposeFutureProvider<Map<String, dynamic>> {
  /// See also [detailPostingan].
  DetailPostinganProvider(
    String id,
  ) : this._internal(
          (ref) => detailPostingan(
            ref as DetailPostinganRef,
            id,
          ),
          from: detailPostinganProvider,
          name: r'detailPostinganProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$detailPostinganHash,
          dependencies: DetailPostinganFamily._dependencies,
          allTransitiveDependencies:
              DetailPostinganFamily._allTransitiveDependencies,
          id: id,
        );

  DetailPostinganProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.id,
  }) : super.internal();

  final String id;

  @override
  Override overrideWith(
    FutureOr<Map<String, dynamic>> Function(DetailPostinganRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: DetailPostinganProvider._internal(
        (ref) => create(ref as DetailPostinganRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        id: id,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<Map<String, dynamic>> createElement() {
    return _DetailPostinganProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is DetailPostinganProvider && other.id == id;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, id.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin DetailPostinganRef on AutoDisposeFutureProviderRef<Map<String, dynamic>> {
  /// The parameter `id` of this provider.
  String get id;
}

class _DetailPostinganProviderElement
    extends AutoDisposeFutureProviderElement<Map<String, dynamic>>
    with DetailPostinganRef {
  _DetailPostinganProviderElement(super.provider);

  @override
  String get id => (origin as DetailPostinganProvider).id;
}

String _$komentarNotifierHash() => r'202c8e2e24cbe674c7b688801e635d634703d30d';

/// See also [KomentarNotifier].
@ProviderFor(KomentarNotifier)
final komentarNotifierProvider =
    AutoDisposeNotifierProvider<KomentarNotifier, AsyncValue<void>>.internal(
  KomentarNotifier.new,
  name: r'komentarNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$komentarNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$KomentarNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
