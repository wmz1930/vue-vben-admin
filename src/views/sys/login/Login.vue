<template>
  <div :class="prefixCls" class="relative w-full h-full px-4">
    <div class="flex items-center absolute right-4 top-4">
      <AppDarkModeToggle class="enter-x mr-2" v-if="!sessionTimeout" />
      <AppLocalePicker
        class="text-white enter-x xl:text-gray-600"
        :show-text="false"
        v-if="!sessionTimeout && showLocale"
      />
    </div>

    <span class="-enter-x xl:hidden">
      <AppLogo :alwaysShowTitle="true" />
    </span>

    <div class="container relative h-full py-2 mx-auto sm:px-10">
      <div class="flex h-full">
        <div class="hidden min-h-full pl-4 mr-4 xl:flex xl:flex-col xl:w-6/12">
          <AppLogo class="-enter-x" />
          <div class="my-auto">
            <img
              :alt="title"
              src="../../../assets/svg/login-box-bg.svg"
              class="w-1/2 -mt-16 -enter-x"
            />
            <div class="mt-10 font-medium text-white -enter-x">
              <span class="inline-block mt-4 text-3xl"> {{ t('sys.login.signInTitle') }}</span>
            </div>
            <div class="mt-5 font-normal text-white dark:text-gray-500 -enter-x">
              {{ t('sys.login.signInDesc') }}
            </div>
          </div>
        </div>
        <div class="flex w-full h-full py-5 xl:h-auto xl:py-0 xl:my-0 xl:w-6/12">
          <div
            :class="`${prefixCls}-form`"
            class="relative w-full px-5 py-8 mx-auto my-auto rounded-md shadow-md xl:ml-16 xl:bg-transparent sm:px-8 xl:p-4 xl:shadow-none sm:w-3/4 lg:w-2/4 xl:w-auto enter-x"
          >
            <LoginForm
              ref="loginFormRef"
              @show-verify="handleShowVerify"
              @refresh-image-code="refreshImageCode"
            />
            <ForgetPasswordForm
              ref="forgetPasswordFormRef"
              @show-verify="handleShowVerify"
              @refresh-image-code="refreshImageCode"
            />
            <RegisterForm
              ref="registerFormRef"
              @show-verify="handleShowVerify"
              @refresh-image-code="refreshImageCode"
            />
            <MobileForm
              ref="mobileFormRef"
              @show-verify="handleShowVerify"
              @refresh-image-code="refreshImageCode"
            />
            <QrCodeForm ref="qrCodeFormRef" />
          </div>
        </div>
      </div>
    </div>
  </div>
  <Verify
    @success="handleSubmit"
    :mode="'pop'"
    :captchaType="captchaState.slidingCaptchaType"
    :imgSize="{ width: '330px', height: '155px' }"
    ref="verifyRef"
  />
</template>
<script lang="ts">
  import { defineComponent, ref, unref, computed, onBeforeMount } from 'vue';
  import { AppLogo } from '/@/components/Application';
  import { AppLocalePicker, AppDarkModeToggle } from '/@/components/Application';
  import LoginForm from './LoginForm.vue';
  import ForgetPasswordForm from './ForgetPasswordForm.vue';
  import RegisterForm from './RegisterForm.vue';
  import MobileForm from './MobileForm.vue';
  import QrCodeForm from './QrCodeForm.vue';
  import { useGlobSetting } from '/@/hooks/setting';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { useLocaleStore } from '/@/store/modules/locale';

  import { LoginStateEnum, useLoginState, useCaptchaState } from './useLogin';

  import Verify from '/@/components/verifition/Verify.vue';

  import { getCaptchaType, getImageCaptcha } from '/@/api/login';

  export default defineComponent({
    name: 'Login',
    components: {
      AppLogo,
      AppLocalePicker,
      AppDarkModeToggle,
      LoginForm,
      ForgetPasswordForm,
      RegisterForm,
      MobileForm,
      QrCodeForm,
      Verify,
    },
    props: {
      sessionTimeout: {
        type: Boolean,
      },
    },
    setup(_, {}) {
      const globSetting = useGlobSetting();
      const { prefixCls } = useDesign('login');
      const { t } = useI18n();
      const localeStore = useLocaleStore();
      const showLocale = localeStore.getShowPicker;
      const title = computed(() => globSetting?.title ?? '');

      const { getLoginState } = useLoginState();

      const {
        setGrantType,
        setLoginCaptchaType,
        setSlidingCaptchaType,
        setCaptchaImage,
        getCaptchaState,
      } = useCaptchaState();

      // 滑动验证码引用
      const verifyRef = ref();
      // 账号密码登录
      const loginFormRef = ref();
      // 手机号验证码登录
      const mobileFormRef = ref();
      // 用户注册
      const registerFormRef = ref();
      // 忘记密码
      const forgetPasswordFormRef = ref();

      const captchaState = unref(getCaptchaState);

      const loginState = unref(getLoginState);

      // 获取系统配置的验证码方式
      onBeforeMount(async () => {
        const loginCaptchaType = await queryCaptchaType();
        setLoginCaptchaType(loginCaptchaType);
        if (captchaState.loginCaptchaType === 'image') {
          // 加载图片验证码
          refreshImageCode();
        }
      });

      // 获取系统配置的验证码方式loginCaptchaType：sliding: 滑动验证码 image: 图片验证码
      async function queryCaptchaType(): Promise<string | ''> {
        return await getCaptchaType().then((res) => {
          return res;
        });
      }

      // 当loginCaptchaType = image时刷新图片验证码的方法
      function refreshImageCode() {
        getImageCaptcha().then((res) => {
          captchaState.captchaKey = res.captchaKey;
          captchaState.captchaImage = res.captchaImage;
        });
      }

      function handleShowVerify() {
        verifyRef.value.show();
      }

      // 点击滑动验证码，成功之后的回调
      function handleSubmit(params) {
        if (loginState === LoginStateEnum.LOGIN) {
          loginFormRef.value.handleLoginSubmit(params);
        } else if (loginState === LoginStateEnum.MOBILE) {
          mobileFormRef.value.handleLoginSubmit(params);
        } else if (loginState === LoginStateEnum.REGISTER) {
          registerFormRef.value.handleRegisterSubmit(params);
        } else if (loginState === LoginStateEnum.RESET_PASSWORD) {
          forgetPasswordFormRef.value.handleResetSubmit(params);
        }
      }

      return {
        t,
        prefixCls,
        loginFormRef,
        mobileFormRef,
        registerFormRef,
        forgetPasswordFormRef,
        queryCaptchaType,
        refreshImageCode,
        captchaState,
        setGrantType,
        setLoginCaptchaType,
        setSlidingCaptchaType,
        setCaptchaImage,
        getCaptchaState,
        verifyRef,
        handleShowVerify,
        handleSubmit,
        showLocale,
        title,
      };
    },
  });
</script>
<style lang="less">
  @prefix-cls: ~'@{namespace}-login';
  @logo-prefix-cls: ~'@{namespace}-app-logo';
  @countdown-prefix-cls: ~'@{namespace}-countdown-input';
  @dark-bg: #293146;

  html[data-theme='dark'] {
    .@{prefix-cls} {
      background-color: @dark-bg;

      &::before {
        background-image: url(/@/assets/svg/login-bg-dark.svg);
      }

      .ant-input,
      .ant-input-password {
        background-color: #232a3b;
      }

      .ant-btn:not(.ant-btn-link):not(.ant-btn-primary) {
        border: 1px solid #4a5569;
      }

      &-form {
        background: transparent !important;
      }

      .app-iconify {
        color: #fff;
      }
    }

    input.fix-auto-fill,
    .fix-auto-fill input {
      -webkit-text-fill-color: #c9d1d9 !important;
      box-shadow: inherit !important;
    }
  }

  .@{prefix-cls} {
    min-height: 100%;
    overflow: hidden;
    @media (max-width: @screen-xl) {
      background-color: #293146;

      .@{prefix-cls}-form {
        background-color: #fff;
      }
    }

    &::before {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      margin-left: -48%;
      background-image: url(/@/assets/svg/login-bg.svg);
      background-position: 100%;
      background-repeat: no-repeat;
      background-size: auto 100%;
      content: '';
      @media (max-width: @screen-xl) {
        display: none;
      }
    }

    .@{logo-prefix-cls} {
      position: absolute;
      top: 12px;
      height: 30px;

      &__title {
        font-size: 16px;
        color: #fff;
      }

      img {
        width: 32px;
      }
    }

    .container {
      .@{logo-prefix-cls} {
        display: flex;
        width: 60%;
        height: 80px;

        &__title {
          font-size: 24px;
          color: #fff;
        }

        img {
          width: 48px;
        }
      }
    }

    .v-code-img-input {
      min-width: 70% !important;
    }

    .v-code-img {
      display: inline-block;
      vertical-align: top;
      height: 40px;
      width: 100%;
      border-radius: 1px;
      border: 1px solid #40a9ff !important;
      cursor: pointer;
      opacity: 0.8;
      filter: alpha(opacity=60);
    }

    &-sign-in-way {
      .anticon {
        font-size: 22px;
        color: #888;
        cursor: pointer;

        &:hover {
          color: @primary-color;
        }
      }
    }

    input:not([type='checkbox']) {
      min-width: 360px;

      @media (max-width: @screen-xl) {
        min-width: 320px;
      }

      @media (max-width: @screen-lg) {
        min-width: 260px;
      }

      @media (max-width: @screen-md) {
        min-width: 240px;
      }

      @media (max-width: @screen-sm) {
        min-width: 160px;
      }
    }

    .@{countdown-prefix-cls} input {
      min-width: unset;
    }

    .ant-divider-inner-text {
      font-size: 12px;
      color: @text-color-secondary;
    }
  }
</style>
