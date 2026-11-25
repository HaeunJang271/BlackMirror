# 원스토어 안드로이드 빌드

## 준비

- Node.js 22.6 이상, Android Studio와 Android SDK Platform 36을 설치합니다. Capacitor 8은 Android Studio 2025.2.1 이상이 필요합니다.
- `npm install` 후 `npm run build:android`를 실행합니다. 이 명령은 `.env.onestore`를 적용하고 웹 결과물을 `android/`에 동기화합니다.
- Android Studio에서 **Open**으로 `android` 폴더를 열고 Gradle 동기화를 완료합니다. SDK 경로를 묻는 경우 SDK Manager에서 설치한 경로를 선택합니다.
- 기본 패키지 ID는 `com.blackscale.game`입니다. 첫 출시 전에 실제 사용할 고유 ID를 정하고, 변경 시 `capacitor.config.json`, `android/app/build.gradle`의 `applicationId`·`namespace`, `MainActivity.java`의 패키지 및 경로, `strings.xml`을 함께 수정한 뒤 다시 동기화합니다. 출시 후에는 패키지 ID를 바꾸면 기존 앱의 업데이트가 아닙니다.
- 기본 아이콘과 스플래시 이미지는 Capacitor 템플릿입니다. 출시 전에 `android/app/src/main/res/`의 아이콘과 스플래시를 게임 자산으로 교체하고, 실제 기기에서 화면 여백·터치·뒤로가기·사운드와 무료 부활을 확인합니다.

## 서명 및 업로드

GitHub Actions에서 서명된 AAB를 빌드하려면 저장소의 Actions secrets에 `KEYSTORE_BASE64` (키스토어 파일의 base64), `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`를 등록합니다. `main`에 push하거나 **Build signed Android App Bundle**을 수동 실행하면 `onestore-release-aab` 아티팩트가 생성됩니다. 기존 앱을 업데이트할 때는 반드시 같은 서명키를 사용합니다.

1. Android Studio에서 **Build → Generate Signed Bundle / APK**를 선택합니다.
2. **Android App Bundle** 또는 **APK**를 고르고, 기존 키스토어를 선택하거나 **Create new**로 배포 키를 만듭니다. 키스토어와 비밀번호는 별도로 안전하게 보관합니다.
3. **release** 빌드를 생성합니다. 결과물은 `android/app/build/outputs/bundle/release/` 또는 `android/app/build/outputs/apk/release/`에서 확인합니다.
4. [원스토어 개발자센터](https://dev.onestore.co.kr/)에서 상품을 등록하고 서명된 AAB 또는 APK와 스토어 정보를 업로드한 뒤 검증을 요청합니다.
5. 업데이트할 때는 같은 패키지 ID·서명키를 사용하고 `android/app/build.gradle`의 `versionCode`를 올립니다.

원스토어 빌드에서 부활은 광고 없이 무료로 한 번 제공됩니다. 일반 웹 및 토스 빌드의 광고 설정은 기존대로 유지됩니다.
