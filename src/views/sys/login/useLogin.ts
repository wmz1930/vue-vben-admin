import type { ValidationRule } from 'ant-design-vue/lib/form/Form';
import type { RuleObject } from 'ant-design-vue/lib/form/interface';
import { ref, computed, unref, Ref } from 'vue';
import { useI18n } from '/@/hooks/web/useI18n';

export enum LoginStateEnum {
  LOGIN,
  REGISTER,
  RESET_PASSWORD,
  MOBILE,
  QR_CODE,
}

const currentState = ref(LoginStateEnum.LOGIN);

// 验证码登录相关配置
const captchaState = ref({
  // 获取token的模式
  grant_type: 'password',
  // 验证码是滑动验证码还是图片验证码
  loginCaptchaType: 'sliding',
  // 滑动验证码的形式
  slidingCaptchaType: 'blockPuzzle',
  // 图片验证码校验标识
  captchaKey: '',
  // 图片验证码的默认图片
  captchaImage:
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAICRAEAOw==',
});

export function useLoginState() {
  // 登录方式
  function setLoginState(state: LoginStateEnum) {
    currentState.value = state;
  }

  function handleBackLogin() {
    setLoginState(LoginStateEnum.LOGIN);
  }

  const getLoginState = computed(() => currentState.value);

  return { setLoginState, getLoginState, handleBackLogin };
}

export function useCaptchaState() {
  function setGrantType(grant_type: string) {
    captchaState.value.grant_type = grant_type;
  }

  function setLoginCaptchaType(loginCaptchaType: string) {
    captchaState.value.loginCaptchaType = loginCaptchaType;
  }

  function setSlidingCaptchaType(slidingCaptchaType: string) {
    captchaState.value.slidingCaptchaType = slidingCaptchaType;
  }

  function setCaptchaKey(captchaKey: string) {
    captchaState.value.captchaKey = captchaKey;
  }

  function setCaptchaImage(captchaImage: string) {
    captchaState.value.captchaImage = captchaImage;
  }

  const getCaptchaState = computed(() => captchaState.value);

  return {
    setGrantType,
    setLoginCaptchaType,
    setSlidingCaptchaType,
    setCaptchaKey,
    setCaptchaImage,
    getCaptchaState,
  };
}

export function useFormValid<T extends Object = any>(formRef: Ref<any>) {
  async function validForm() {
    const form = unref(formRef);
    if (!form) return;
    const data = await form.validate();
    return data as T;
  }

  return { validForm };
}

export function useFormRules(formData?: Recordable) {
  const { t } = useI18n();

  const getAccountFormRule = computed(() => createRule(t('sys.login.accountPlaceholder')));
  const getPasswordFormRule = computed(() => createRule(t('sys.login.passwordPlaceholder')));
  const getCaptchaFormRule = computed(() => createRule(t('sys.login.captchaPlaceholder')));
  const getSmsFormRule = computed(() => createRule(t('sys.login.smsPlaceholder')));
  const getMobileFormRule = computed(() => createRule(t('sys.login.mobilePlaceholder')));

  const validatePolicy = async (_: RuleObject, value: boolean) => {
    return !value ? Promise.reject(t('sys.login.policyPlaceholder')) : Promise.resolve();
  };

  const validateConfirmPassword = (password: string) => {
    return async (_: RuleObject, value: string) => {
      if (!value) {
        return Promise.reject(t('sys.login.passwordPlaceholder'));
      }
      if (value !== password) {
        return Promise.reject(t('sys.login.diffPwd'));
      }
      return Promise.resolve();
    };
  };

  const getFormRules = computed((): { [k: string]: ValidationRule | ValidationRule[] } => {
    const accountFormRule = unref(getAccountFormRule);
    const passwordFormRule = unref(getPasswordFormRule);
    const captchaFormRule = unref(getCaptchaFormRule);
    const smsFormRule = unref(getSmsFormRule);
    const mobileFormRule = unref(getMobileFormRule);

    const mobileRule = {
      sms: smsFormRule,
      mobile: mobileFormRule,
    };

    const usernameRule = {
      username: accountFormRule,
      password: passwordFormRule,
    };

    if (
      captchaState.value.grant_type === 'captcha' &&
      captchaState.value.loginCaptchaType === 'image'
    ) {
      usernameRule['captcha_code'] = captchaFormRule;
    }

    switch (unref(currentState)) {
      // register form rules
      case LoginStateEnum.REGISTER:
        return {
          username: accountFormRule,
          password: passwordFormRule,
          confirmPassword: [
            { validator: validateConfirmPassword(formData?.password), trigger: 'change' },
          ],
          policy: [{ validator: validatePolicy, trigger: 'change' }],
          ...mobileRule,
        };

      // reset password form rules
      case LoginStateEnum.RESET_PASSWORD:
        return {
          username: accountFormRule,
          ...mobileRule,
        };

      // mobile form rules
      case LoginStateEnum.MOBILE:
        return mobileRule;

      // login form rules
      default:
        return usernameRule;
    }
  });
  return { getFormRules };
}

function createRule(message: string) {
  return [
    {
      required: true,
      message,
      trigger: 'change',
    },
  ];
}
