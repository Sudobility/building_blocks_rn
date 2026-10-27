//
//  RNSForceCompactTabBar.m
//
//  Keeps the native tab bar along the bottom — the compact, iPhone-style bar —
//  on every device, overriding iPadOS 18's top / floating tab bar. This is the
//  family's shared "use a compact tab bar on iPad" rule for apps whose tabs are
//  drawn by react-native-screens (`createNativeBottomTabNavigator`). It ships
//  here, in a pod every app already links, so an app gets the behaviour just by
//  depending on this package — there is nothing to wire into its AppDelegate,
//  and nothing is edited inside react-native-screens itself.
//
//  react-native-screens draws the tab bar with its own UITabBarController
//  subclass, RNSTabBarController, which it allocates itself
//  (RNSTabsHostComponentView), so there is no subclass of ours for it to use.
//  Instead this installs an override of that controller's lifecycle methods at
//  load time — reaching the class by name, so it needs none of
//  react-native-screens' headers and keeps working across its upgrades — and,
//  after the original runs, pins the horizontal size class to compact. iPadOS
//  18 otherwise floats the bar across the top in a regular size class; compact
//  keeps it along the bottom. Only the UIKit trait is overridden: the hardware
//  idiom is untouched, so `Platform.isPad` stays true and the app still lays
//  out as a tablet. The consuming app's JS `hasTopTabBar()` is pinned false to
//  match.
//
//  `+load` runs automatically at image load because every app links this pod
//  with `-ObjC` in OTHER_LDFLAGS, which force-loads category/load code from
//  static libraries. Apps whose tabs are NOT react-native-screens (for example
//  the ones on react-native-bottom-tabs) simply have no RNSTabBarController, so
//  this is a harmless no-op there — and if react-native-screens ever renames
//  the class or these methods, the install does nothing and the app keeps
//  whatever bar the platform draws. It never crashes.
//

#import <TargetConditionals.h>

#if TARGET_OS_IOS

#import <UIKit/UIKit.h>
#import <objc/runtime.h>

@interface RNSForceCompactTabBar : NSObject
+ (void)rns_install;
@end

@implementation RNSForceCompactTabBar

static void RNSForceCompact(UIViewController *controller)
{
  if (![controller isKindOfClass:[UITabBarController class]]) {
    return;
  }
  if (@available(iOS 18.0, *)) {
    // Assign unconditionally, never read first: reading
    // `traitOverrides.horizontalSizeClass` when no override is present throws
    // ("Can't return value for trait ... that has no override"). Assigning is
    // idempotent and cheap, so there is no need to test the current value.
    controller.traitOverrides.horizontalSizeClass =
        UIUserInterfaceSizeClassCompact;
  }
}

// The inherited (or pre-existing) implementations we chain to, kept per
// selector. `viewDidLoad` fires once; `viewWillAppear:` reasserts in case the
// controller is ever reconfigured after load.
static IMP RNSOriginalViewDidLoad = NULL;
static IMP RNSOriginalViewWillAppear = NULL;

static void RNSViewDidLoad(id self, SEL _cmd)
{
  if (RNSOriginalViewDidLoad) {
    ((void (*)(id, SEL))RNSOriginalViewDidLoad)(self, _cmd);
  }
  RNSForceCompact(self);
}

static void RNSViewWillAppear(id self, SEL _cmd, BOOL animated)
{
  if (RNSOriginalViewWillAppear) {
    ((void (*)(id, SEL, BOOL))RNSOriginalViewWillAppear)(self, _cmd, animated);
  }
  RNSForceCompact(self);
}

// Installs `newImp` for `sel` on `cls` alone. If `cls` only inherits the
// method, a fresh override is added to `cls` (so sibling classes such as a
// plain UITabBarController are untouched) and `*chainStore` holds the
// inherited implementation to call as "super". If `cls` already defines its
// own, that one is replaced and `*chainStore` holds it, so its behaviour is
// preserved.
static void RNSInstallOverride(Class cls, SEL sel, IMP newImp,
                               const char *types, IMP *chainStore)
{
  Method inherited = class_getInstanceMethod(cls, sel);
  if (inherited == NULL) {
    return;
  }
  *chainStore = method_getImplementation(inherited);
  if (!class_addMethod(cls, sel, newImp, types)) {
    Method own = class_getInstanceMethod(cls, sel);
    *chainStore = method_getImplementation(own);
    method_setImplementation(own, newImp);
  }
}

+ (void)load
{
  // Defer the install to the first main-runloop tick. At `+load` time
  // react-native-screens' classes may not be registered yet — link order
  // across pods is not guaranteed — so RNSTabBarController could still be nil.
  // By the first runloop tick, after main() and every `+load` has run, every
  // class is registered, while this is still long before any tab controller is
  // created (that waits on the JS bundle).
  dispatch_async(dispatch_get_main_queue(), ^{
    [self rns_install];
  });
}

+ (void)rns_install
{
  Class cls = NSClassFromString(@"RNSTabBarController");
  if (cls == Nil) {
    return;
  }
  RNSInstallOverride(cls, @selector(viewDidLoad), (IMP)RNSViewDidLoad, "v@:",
                     &RNSOriginalViewDidLoad);
  RNSInstallOverride(cls, @selector(viewWillAppear:), (IMP)RNSViewWillAppear,
                     "v@:B", &RNSOriginalViewWillAppear);
}

@end

#endif // TARGET_OS_IOS
