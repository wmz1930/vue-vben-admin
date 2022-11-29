import { defHttp } from '/@/utils/http/axios';
import { LoginParams, LogoutParams, LoginResultModel } from './sys/model/userModel';
import { AxiosAuthRefreshRequestConfig } from 'axios-auth-refresh';

import { ErrorMessageMode } from '/#/axios';

export enum LoginApiEnum {
  Login = '/gitegg-oauth/oauth/token',
  Logout = '/gitegg-oauth/oauth/logout',
  CaptchaType = '/gitegg-oauth/oauth/captcha/type',
  ImageCaptcha = '/gitegg-oauth/oauth/captcha/image',
  ForgePassword = '/auth/forge-password',
  Register = '/auth/register',
  twoStepCode = '/auth/2step-code',
  SendSms = '/gitegg-oauth/oauth/sms/captcha/send',
  SendSmsErr = '/account/sms_err',
  UserInfo = '/gitegg-service-system/auth/user/info',
  UserMenu = '/user/nav',
}

/**
 * @description: user login api
 */
export function login(params: LoginParams, mode: ErrorMessageMode = 'modal') {
  return defHttp.post<LoginResultModel>(
    {
      url: LoginApiEnum.Login,
      params,
    },
    {
      errorMessageMode: mode,
    },
  );
}

/**
 * @description: user login api
 */
export function logout(params: LogoutParams, mode: ErrorMessageMode = 'modal') {
  return defHttp.post(
    {
      url: LoginApiEnum.Logout,
      skipAuthRefresh: true,
      params,
    } as AxiosAuthRefreshRequestConfig,
    {
      errorMessageMode: mode,
    },
  );
}

export function getCaptchaType() {
  return defHttp.get({
    url: LoginApiEnum.CaptchaType,
    method: 'get',
  });
}

export function getImageCaptcha() {
  return defHttp.get({
    url: LoginApiEnum.ImageCaptcha,
  });
}

export function getSmsCaptcha(parameter) {
  return defHttp.post({
    url: LoginApiEnum.SendSms,
    data: parameter,
  });
}

export function getInfo() {
  return defHttp.get({
    url: LoginApiEnum.UserInfo,
  });
}
