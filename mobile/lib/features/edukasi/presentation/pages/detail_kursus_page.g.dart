// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'detail_kursus_page.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$detailKursusHash() => r'5f0efeb4d65aff650c33c511c5a240a6463706fd';

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

/// See also [detailKursus].
@ProviderFor(detailKursus)
const detailKursusProvider = DetailKursusFamily();

/// See also [detailKursus].
class DetailKursusFamily extends Family<AsyncValue<Map<String, dynamic>>> {
  /// See also [detailKursus].
  const DetailKursusFamily();

  /// See also [detailKursus].
  DetailKursusProvider call(
    String id,
  ) {
    return DetailKursusProvider(
      id,
    );
  }

  @override
  DetailKursusProvider getProviderOverride(
    covariant DetailKursusProvider provider,
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
  String? get name => r'detailKursusProvider';
}

/// See also [detailKursus].
class DetailKursusProvider
    extends AutoDisposeFutureProvider<Map<String, dynamic>> {
  /// See also [detailKursus].
  DetailKursusProvider(
    String id,
  ) : this._internal(
          (ref) => detailKursus(
            ref as DetailKursusRef,
            id,
          ),
          from: detailKursusProvider,
          name: r'detailKursusProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$detailKursusHash,
          dependencies: DetailKursusFamily._dependencies,
          allTransitiveDependencies:
              DetailKursusFamily._allTransitiveDependencies,
          id: id,
        );

  DetailKursusProvider._internal(
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
    FutureOr<Map<String, dynamic>> Function(DetailKursusRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: DetailKursusProvider._internal(
        (ref) => create(ref as DetailKursusRef),
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
    return _DetailKursusProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is DetailKursusProvider && other.id == id;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, id.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin DetailKursusRef on AutoDisposeFutureProviderRef<Map<String, dynamic>> {
  /// The parameter `id` of this provider.
  String get id;
}

class _DetailKursusProviderElement
    extends AutoDisposeFutureProviderElement<Map<String, dynamic>>
    with DetailKursusRef {
  _DetailKursusProviderElement(super.provider);

  @override
  String get id => (origin as DetailKursusProvider).id;
}

String _$daftarKursusNotifierHash() =>
    r'b1d7a07306ed87911c7a1922f8140ef2186fef5e';

/// See also [DaftarKursusNotifier].
@ProviderFor(DaftarKursusNotifier)
final daftarKursusNotifierProvider = AutoDisposeNotifierProvider<
    DaftarKursusNotifier, AsyncValue<void>>.internal(
  DaftarKursusNotifier.new,
  name: r'daftarKursusNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$daftarKursusNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$DaftarKursusNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
