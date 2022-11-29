<template>
  <LoginFormTitle v-show="getShow" class="enter-x" />
  <Form
    class="p-4 enter-x"
    :model="formData"
    :rules="getFormRules"
    ref="formRef"
    v-show="getShow"
    @keypress.enter="handleLoginValid"
  >
    <FormItem name="username" class="enter-x">
      <Input
        size="large"
        v-model:value="formData.username"
        :placeholder="t('sys.login.userName')"
        class="fix-auto-fill"
      />
    </FormItem>
    <FormItem name="password" class="enter-x">
      <InputPassword
        size="large"
        visibilityToggle
        v-model:value="formData.password"
        :placeholder="t('sys.login.password')"
      />
    </FormItem>

    <FormItem name="captcha_code" v-show="captchaState.loginCaptchaType === 'image'">
      <ARow class="enter-x">
        <ACol :span="15">
          <Input
            size="large"
            v-model:value="formData.captcha_code"
            class="v-code-img-input"
            :placeholder="t('sys.login.captcha')"
          />
        </ACol>
        <ACol :span="1" />
        <ACol :span="8">
          <img
            :src="captchaState.captchaImage"
            alt=""
            @click="refreshImageCode"
            class="v-code-img"
          />
        </ACol>
      </ARow>
    </FormItem>

    <ARow class="enter-x">
      <ACol :span="12">
        <FormItem>
          <!-- No logic, you need to deal with it yourself -->
          <Checkbox v-model:checked="formData.rememberMe" size="small">
            {{ t('sys.login.rememberMe') }}
          </Checkbox>
        </FormItem>
      </ACol>
      <ACol :span="12">
        <FormItem :style="{ 'text-align': 'right' }">
          <!-- No logic, you need to deal with it yourself -->
          <Button type="link" size="small" @click="setLoginState(LoginStateEnum.RESET_PASSWORD)">
            {{ t('sys.login.forgetPassword') }}
          </Button>
        </FormItem>
      </ACol>
    </ARow>

    <FormItem class="enter-x">
      <Button type="primary" size="large" block @click="handleLoginValid" :loading="loading">
        {{ t('sys.login.loginButton') }}
      </Button>
      <!-- <Button size="large" class="mt-4 enter-x" block @click="handleRegister">
        {{ t('sys.login.registerButton') }}
      </Button> -->
    </FormItem>
    <ARow class="enter-x">
      <ACol :md="8" :xs="24">
        <Button block @click="setLoginState(LoginStateEnum.MOBILE)">
          {{ t('sys.login.mobileSignInFormTitle') }}
        </Button>
      </ACol>
      <ACol :md="8" :xs="24" class="!my-2 !md:my-0 xs:mx-0 md:mx-2">
        <Button block @click="setLoginState(LoginStateEnum.QR_CODE)">
          {{ t('sys.login.qrSignInFormTitle') }}
        </Button>
      </ACol>
      <ACol :md="7" :xs="24">
        <Button block @click="setLoginState(LoginStateEnum.REGISTER)">
          {{ t('sys.login.registerButton') }}
        </Button>
      </ACol>
    </ARow>

    <Divider class="enter-x">{{ t('sys.login.otherSignIn') }}</Divider>

    <div class="flex justify-evenly enter-x" :class="`${prefixCls}-sign-in-way`">
      <GithubFilled />
      <WechatFilled />
      <AlipayCircleFilled />
      <GoogleCircleFilled />
      <TwitterCircleFilled />
    </div>
  </Form>
</template>
<script lang="ts">
  import { defineComponent, reactive, ref, unref, computed, onMounted } from 'vue';
  import { Checkbox, Form, Input, Row, Col, Button, Divider } from 'ant-design-vue';
  import { encryptByMd5 } from '/@/utils/cipher';
  import {
    GithubFilled,
    WechatFilled,
    AlipayCircleFilled,
    GoogleCircleFilled,
    TwitterCircleFilled,
  } from '@ant-design/icons-vue';
  import LoginFormTitle from './LoginFormTitle.vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useUserStore } from '/@/store/modules/user';
  import {
    LoginStateEnum,
    useLoginState,
    useCaptchaState,
    useFormRules,
    useFormValid,
  } from './useLogin';
  import { useDesign } from '/@/hooks/web/useDesign';
  import {
    setAuthCacheWithTimeOut,
    removeAuthCacheWithTimeOut,
    getAuthCacheWithTimeOut,
  } from '/@/utils/auth';
  import { useGlobSetting } from '/@/hooks/setting';

  export default defineComponent({
    name: 'LoginForm',
    components: {
      [Col.name]: Col,
      [Row.name]: Row,
      Checkbox,
      Button,
      Form,
      FormItem: Form.Item,
      Input,
      LoginFormTitle,
      InputPassword: Input.Password,
      Divider,
      GithubFilled,
      WechatFilled,
      AlipayCircleFilled,
      GoogleCircleFilled,
      TwitterCircleFilled,
    },
    emits: ['show-verify', 'refresh-image-code'],
    setup(_, { emit }) {
      const { t } = useI18n();
      const { notification, createErrorModal } = useMessage();
      const { prefixCls } = useDesign('login');
      const userStore = useUserStore();
      const globSetting = useGlobSetting();

      const { setLoginState, getLoginState } = useLoginState();
      const { getCaptchaState } = useCaptchaState();
      const { getFormRules } = useFormRules();

      const formRef = ref();
      const loading = ref(false);
      const verify = ref();
      const rememberMe = ref(false);

      const formData = reactive({
        username: '',
        password: '',
        grant_type: 'password',
        captcha_key: '',
        captcha_code: '',
        rememberMe: false,
      });

      const { validForm } = useFormValid(formRef);

      const getShow = computed(() => unref(getLoginState) === LoginStateEnum.LOGIN);

      const captchaState = computed(() => unref(getCaptchaState));

      // 挂载，判断是否有记住密码，如果有，则自动填充用户名密码
      onMounted(() => {
        const rememberMe = getAuthCacheWithTimeOut(
          globSetting.tenantId + '-' + globSetting.clientId + '-rememberMe',
        ) as boolean;
        if (rememberMe) {
          const username = getAuthCacheWithTimeOut(
            globSetting.tenantId + '-' + globSetting.clientId + '-username',
          ) as string;
          const password = getAuthCacheWithTimeOut(
            globSetting.tenantId + '-' + globSetting.clientId + '-password',
          ) as string;
          if (username !== '' && password !== '') {
            formData.username = username;
            formData.password = password;
            formData.rememberMe = rememberMe;
          }
        }
      });

      // 当loginCaptchaType = image时刷新图片验证码的方法
      function refreshImageCode() {
        emit('refresh-image-code', {});
      }

      async function handleLoginValid() {
        const data = await validForm();
        if (!data) return;
        // 如果是授权码模式，并且是滑动验证码，那么需要进行验证码验证
        if (
          formData.grant_type === 'captcha' &&
          captchaState.value.loginCaptchaType === 'sliding'
        ) {
          emit('show-verify', {});
        } else {
          handleLoginSubmit(undefined);
        }
      }

      // 滑动验证码二次校验并提交登录
      async function handleLoginSubmit(params) {
        // params 返回的二次验证参数, 和登录参数一起回传给登录接口，方便后台进行二次验证
        try {
          loading.value = true;
          const userInfo = await userStore.login({
            username: formData.username,
            password: encryptByMd5(formData.password),
            grant_type: formData.grant_type,
            captcha_key: captchaState.value.captchaKey,
            captcha_code: formData.captcha_code,
            sliding_type: captchaState.value.slidingCaptchaType,
            captcha_verification: params ? params?.captchaVerification : undefined,
            mode: 'none', //不要默认的错误提示
          });

          if (userInfo) {
            loginSuccess();
            notification.success({
              message: t('sys.login.loginSuccessTitle'),
              description: `${t('sys.login.loginSuccessDesc')}: ${userInfo.realName}`,
              duration: 3,
            });
          }
        } catch (error) {
          const errMsg = (error as unknown as Error).message || t('sys.api.networkExceptionMsg');
          if (errMsg?.indexOf('错误码:427') !== -1) {
            // 密码错误次数超过最大限值，请选择验证码模式登录
            formData.grant_type = 'captcha';
            // 如果是滑动验证码，直接弹出滑动验证码界面
            if (captchaState.value.loginCaptchaType === 'sliding') {
              emit('show-verify', {});
            }
          } else {
            createErrorModal({
              title: t('sys.api.errorTip'),
              content: errMsg,
              getContainer: () => document.body.querySelector(`.${prefixCls}`) || document.body,
            });
          }
        } finally {
          loading.value = false;
        }
      }

      // 判断是否记住密码, 最长一周 60 * 60 * 24 * 7 * 1000 = 604800000
      function loginSuccess() {
        const rememberMe = formData.rememberMe;
        const username = formData.username;
        const password = formData.password;
        if (rememberMe && username !== '' && password !== '') {
          setAuthCacheWithTimeOut(
            globSetting.tenantId + '-' + globSetting.clientId + '-username',
            username,
            604800000,
          );
          setAuthCacheWithTimeOut(
            globSetting.tenantId + '-' + globSetting.clientId + '-password',
            password,
            604800000,
          );
          setAuthCacheWithTimeOut(
            globSetting.tenantId + '-' + globSetting.clientId + '-rememberMe',
            true,
            604800000,
          );
        } else {
          removeAuthCacheWithTimeOut(
            globSetting.tenantId + '-' + globSetting.clientId + '-username',
          );
          removeAuthCacheWithTimeOut(
            globSetting.tenantId + '-' + globSetting.clientId + '-password',
          );
          removeAuthCacheWithTimeOut(
            globSetting.tenantId + '-' + globSetting.clientId + '-rememberMe',
          );
        }
      }

      return {
        t,
        prefixCls,
        formRef,
        formData,
        getFormRules,
        rememberMe,
        useCaptchaState,
        handleLoginValid,
        handleLoginSubmit,
        loading,
        setLoginState,
        LoginStateEnum,
        getShow,
        refreshImageCode,
        captchaState,
        verify,
      };
    },
  });
</script>
