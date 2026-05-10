import { webview } from '@kit.ArkWeb';
import { window } from '@kit.ArkUI';
import { BusinessError } from '@kit.BasicServicesKit';
import { hilog } from '@kit.PerformanceAnalysisKit';

const DOMAIN = 0x0000;
const DEFAULT_STATUS_BAR_COLOR = '#151719';
const TRANSPARENT_SYSTEM_BAR_COLOR = '#00000000';

type ThemeColorChange = (color: string) => void;

let onThemeColorChange: ThemeColorChange = (_color: string): void => {};

class SystemBarBridge {
  setThemeColor(color: string): void {
    onThemeColorChange(color);
  }
}

function expandShortHex(color: string): string {
  return color.replace(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/, '#$1$1$2$2$3$3');
}

function shouldUseLightIcon(color: string): boolean {
  const normalizedColor = expandShortHex(color.trim());
  const match = normalizedColor.match(/^#([0-9a-fA-F]{6})/);
  if (!match) {
    return true;
  }

  const red = parseInt(match[1].slice(0, 2), 16);
  const green = parseInt(match[1].slice(2, 4), 16);
  const blue = parseInt(match[1].slice(4, 6), 16);
  const luminance = (red * 0.299 + green * 0.587 + blue * 0.114) / 255;
  return luminance < 0.58;
}

@Entry
@Component
struct Index {
  controller: webview.WebviewController = new webview.WebviewController();
  systemBarBridge: SystemBarBridge = new SystemBarBridge();
  private mainWindow?: window.Window;
  private statusBarContentBaseColor: string = '';

  aboutToAppear(): void {
    webview.WebviewController.setWebDebuggingAccess(true);
    window.getLastWindow(this.getUIContext().getHostContext()).then((mainWindow) => {
      this.mainWindow = mainWindow;
      this.updateStatusBar(DEFAULT_STATUS_BAR_COLOR);
    }).catch((err: BusinessError) => {
      hilog.error(DOMAIN, 'ArkWeb', 'Failed to get window. Cause: %{public}s', JSON.stringify(err));
    });

    onThemeColorChange = (color: string): void => {
      this.updateStatusBar(color);
    };
  }

  aboutToDisappear(): void {
    onThemeColorChange = (_color: string): void => {};
    try {
      this.controller.deleteJavaScriptRegister('photoBorderSystemBar');
    } catch (err) {
      hilog.warn(DOMAIN, 'ArkWeb', 'Failed to delete JavaScriptProxy. Cause: %{public}s', JSON.stringify(err));
    }
  }

  private updateStatusBar(color: string): void {
    const nextColor = expandShortHex(color.trim());
    if (!this.mainWindow || !nextColor || nextColor === this.statusBarContentBaseColor) {
      return;
    }

    this.statusBarContentBaseColor = nextColor;
    const isLightIcon = shouldUseLightIcon(nextColor);
    this.mainWindow.setWindowSystemBarProperties({
      statusBarColor: TRANSPARENT_SYSTEM_BAR_COLOR,
      statusBarContentColor: isLightIcon ? '#FFFFFF' : '#000000',
      isStatusBarLightIcon: isLightIcon
    }).catch((err: BusinessError) => {
      hilog.error(DOMAIN, 'ArkWeb', 'Failed to update status bar. Cause: %{public}s', JSON.stringify(err));
    });
  }

  build() {
    Column() {
      Web({ src: $rawfile('index.html'), controller: this.controller })
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .javaScriptProxy({
          object: this.systemBarBridge,
          name: 'photoBorderSystemBar',
          methodList: ['setThemeColor'],
          controller: this.controller
        })
        .onConsole((event) => {
          hilog.info(
            DOMAIN,
            'ArkWeb',
            'Console[%{public}s] %{public}s (%{public}s:%{public}d)',
            event.message.getMessageLevel(),
            event.message.getMessage(),
            event.message.getSourceId(),
            event.message.getLineNumber()
          );
          return false;
        })
        .width('100%')
        .height('100%')
    }
    .width('100%')
    .height('100%')
  }
}
