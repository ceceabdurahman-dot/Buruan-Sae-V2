// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'komunitas_page.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$daftarPostinganHash() => r'b4640ada21eece60e48c2a19b9524ac249e3caae';

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

/// See also [daftarPostingan].
@ProviderFor(daftarPostingan)
const daftarPostinganProvider = DaftarPostinganFamily();

/// See also [daftarPostingan].
class DaftarPostinganFamily
    extends Family<AsyncValue<List<Map<String, dynamic>>>> {
  /// See also [daftarPostingan].
  const DaftarPostinganFamily();

  /// See also [daftarPostingan].
  DaftarPostinganProvider call({
    String sort = 'terbaru',
  }) {
    return DaftarPostinganProvider(
      sort: sort,
    );
  }

  @override
  DaftarPostinganProvider getProviderOverride(
    covariant DaftarPostinganProvider provider,
  ) {
    return call(
      sort: provider.sort,
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
  String? get name => r'daftarPostinganProvider';
}

/// See also [daftarPostingan].
class DaftarPostinganProvider
    extends AutoDisposeFutureProvider<List<Map<String, dynamic>>> {
  /// See also [daftarPostingan].
  DaftarPostinganProvider({
    String sort = 'terbaru',
  }) : this._internal(
          (ref) => daftarPostingan(
            ref as DaftarPostinganRef,
            sort: sort,
          ),
          from: daftarPostinganProvider,
          name: r'daftarPostinganProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$daftarPostinganHash,
          dependencies: DaftarPostinganFamily._dependencies,
          allTransitiveDependencies:
              DaftarPostinganFamily._allTransitiveDependencies,
          sort: sort,
        );

  DaftarPostinganProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.sort,
  }) : super.internal();

  final String sort;

  @override
  Override overrideWith(
    FutureOr<List<Map<String, dynamic>>> Function(DaftarPostinganRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: DaftarPostinganProvider._internal(
        (ref) => create(ref as DaftarPostinganRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        sort: sort,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<Map<String, dynamic>>> createElement() {
    return _DaftarPostinganProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is DaftarPostinganProvider && other.sort == sort;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, sort.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin DaftarPostinganRef
    on AutoDisposeFutureProviderRef<List<Map<String, dynamic>>> {
  /// The parameter `sort` of this provider.
  String get sort;
}

class _DaftarPostinganProviderElement
    extends AutoDisposeFutureProviderElement<List<Map<String, dynamic>>>
    with DaftarPostinganRef {
  _DaftarPostinganProviderElement(super.provider);

  @override
  String get sort => (origin as DaftarPostinganProvider).sort;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
