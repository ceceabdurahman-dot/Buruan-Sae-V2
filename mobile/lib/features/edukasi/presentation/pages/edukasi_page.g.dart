// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'edukasi_page.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$daftarKursusHash() => r'c0118cdc24dfa3b7ee6ebb8a80bebc62f3279478';

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

/// See also [daftarKursus].
@ProviderFor(daftarKursus)
const daftarKursusProvider = DaftarKursusFamily();

/// See also [daftarKursus].
class DaftarKursusFamily
    extends Family<AsyncValue<List<Map<String, dynamic>>>> {
  /// See also [daftarKursus].
  const DaftarKursusFamily();

  /// See also [daftarKursus].
  DaftarKursusProvider call({
    String? kategori,
    String? level,
  }) {
    return DaftarKursusProvider(
      kategori: kategori,
      level: level,
    );
  }

  @override
  DaftarKursusProvider getProviderOverride(
    covariant DaftarKursusProvider provider,
  ) {
    return call(
      kategori: provider.kategori,
      level: provider.level,
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
  String? get name => r'daftarKursusProvider';
}

/// See also [daftarKursus].
class DaftarKursusProvider
    extends AutoDisposeFutureProvider<List<Map<String, dynamic>>> {
  /// See also [daftarKursus].
  DaftarKursusProvider({
    String? kategori,
    String? level,
  }) : this._internal(
          (ref) => daftarKursus(
            ref as DaftarKursusRef,
            kategori: kategori,
            level: level,
          ),
          from: daftarKursusProvider,
          name: r'daftarKursusProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$daftarKursusHash,
          dependencies: DaftarKursusFamily._dependencies,
          allTransitiveDependencies:
              DaftarKursusFamily._allTransitiveDependencies,
          kategori: kategori,
          level: level,
        );

  DaftarKursusProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.kategori,
    required this.level,
  }) : super.internal();

  final String? kategori;
  final String? level;

  @override
  Override overrideWith(
    FutureOr<List<Map<String, dynamic>>> Function(DaftarKursusRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: DaftarKursusProvider._internal(
        (ref) => create(ref as DaftarKursusRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        kategori: kategori,
        level: level,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<Map<String, dynamic>>> createElement() {
    return _DaftarKursusProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is DaftarKursusProvider &&
        other.kategori == kategori &&
        other.level == level;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, kategori.hashCode);
    hash = _SystemHash.combine(hash, level.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin DaftarKursusRef
    on AutoDisposeFutureProviderRef<List<Map<String, dynamic>>> {
  /// The parameter `kategori` of this provider.
  String? get kategori;

  /// The parameter `level` of this provider.
  String? get level;
}

class _DaftarKursusProviderElement
    extends AutoDisposeFutureProviderElement<List<Map<String, dynamic>>>
    with DaftarKursusRef {
  _DaftarKursusProviderElement(super.provider);

  @override
  String? get kategori => (origin as DaftarKursusProvider).kategori;
  @override
  String? get level => (origin as DaftarKursusProvider).level;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
