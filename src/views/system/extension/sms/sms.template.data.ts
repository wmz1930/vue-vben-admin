import { BasicColumn } from '/@/components/Table';
import { FormSchema } from '/@/components/Table';
import { h } from 'vue';
import { Switch } from 'ant-design-vue';
import {
  updateSmsTemplateStatus,
  checkSmsTemplateExist,
} from '/@/api/system/extension/sms/sms_template';
import { useMessage } from '/@/hooks/web/useMessage';
import { listDictBusiness } from '/@/api/system/base/dictBusiness';
import { listDict } from '/@/api/system/base/dict';

export const columns: BasicColumn[] = [
  {
    title: '序号',
    align: 'center',
    width: 80,
    dataIndex: 'id',
  },
  {
    title: '短信渠道',
    align: 'center',
    width: 200,
    ellipsis: true,
    dataIndex: 'channelId',
  },
  {
    title: '短信编码',
    align: 'center',
    width: 200,
    ellipsis: true,
    dataIndex: 'smsCode',
  },
  {
    title: '短信名称',
    align: 'center',
    width: 200,
    ellipsis: true,
    dataIndex: 'smsName',
  },
  {
    title: '模板ID',
    align: 'center',
    width: 200,
    ellipsis: true,
    dataIndex: 'templateId',
  },
  {
    title: '短信签名',
    align: 'center',
    width: 200,
    ellipsis: true,
    dataIndex: 'signName',
  },
  {
    title: '短信状态',
    align: 'center',
    width: 200,
    ellipsis: true,
    dataIndex: 'templateStatus',
    customRender: ({ record }) => {
      if (!Reflect.has(record, 'pendingStatus')) {
        record.pendingStatus = false;
      }
      return h(Switch, {
        checked: Number(record.templateStatus) === 1,
        checkedChildren: '已启用',
        unCheckedChildren: '已禁用',
        loading: record.pendingStatus,
        onChange(checked: boolean) {
          record.pendingStatus = true;
          const newStatus = checked ? 1 : 0;
          const { createMessage, createConfirm } = useMessage();
          // const { t } = useI18n();
          createConfirm({
            iconType: 'warning',
            title: () => h('span', '操作提示'),
            content: () =>
              h(
                'span',
                newStatus === 1
                  ? `确定要启用短信模板：${record.smsName}？`
                  : `确定要禁用短信模板：${record.smsName}？`,
              ),
            onOk: async () => {
              await updateSmsTemplateStatus(record.id, newStatus)
                .then(() => {
                  record.templateStatus = newStatus;
                  createMessage.success(
                    newStatus === 1
                      ? `已成功启用短信模板：${record.smsName}`
                      : `已成功禁用短信模板：${record.smsName}`,
                  );
                })
                .catch(() => {
                  record.pendingStatus = false;
                  createMessage.error('修改短信模板状态失败');
                })
                .finally(() => {
                  record.pendingStatus = false;
                });
            },
            onCancel: async () => {
              record.pendingStatus = false;
            },
          });
        },
      });
    },
  },
  {
    title: '短信类型',
    align: 'center',
    width: 200,
    ellipsis: true,
    dataIndex: 'templateType',
  },

  {
    title: '缓存有效期',
    align: 'center',
    width: 200,
    ellipsis: true,
    dataIndex: 'cacheTimeOut',
  },
  {
    title: '有效期单位',
    align: 'center',
    width: 200,
    ellipsis: true,
    dataIndex: 'cacheTimeOutUnit',
  },
  {
    title: '发送次数限制',
    align: 'center',
    width: 200,
    ellipsis: true,
    dataIndex: 'sendTimesLimit',
  },
  {
    title: '限制时间间隔',
    align: 'center',
    width: 200,
    ellipsis: true,
    dataIndex: 'sendTimesLimitPeriod',
  },
  {
    title: '时间间隔单位',
    align: 'center',
    width: 200,
    ellipsis: true,
    dataIndex: 'sendTimesLimitPeriodUnit',
  },
  {
    title: '描述',
    align: 'center',
    width: 200,
    ellipsis: true,
    dataIndex: 'comments',
  },
];

export const searchFormSchema: FormSchema[] = [
  {
    field: 'channelId',
    label: '短信渠道',
    component: 'Input',
    colProps: { span: 6 },
  },
  {
    field: 'smsCode',
    label: '短信编码',
    component: 'Input',
    colProps: { span: 6 },
  },
  {
    field: 'smsName',
    label: '短信名称',
    component: 'Input',
    colProps: { span: 6 },
  },
];

export const formSchema: FormSchema[] = [
  {
    field: 'id',
    label: '主键',
    show: false,
    component: 'Input',
  },
  {
    field: 'channelId',
    label: '短信渠道',
    component: 'Input',
  },
  {
    field: 'smsCode',
    label: '短信编码',
    component: 'Input',
  },
  {
    field: 'smsName',
    label: '短信名称',
    required: true,
    component: 'Input',
    dynamicRules: ({ values }) => {
      return [
        {
          required: true,
          message: '请输入短信名称',
        },
        {
          trigger: 'blur',
          message: '短信名称已存在',
          validator: (_, value) => {
            return new Promise((resolve, reject) => {
              const keyData = {
                id: values.id,
                checkField: 'smsName',
                checkValue: value,
              };
              checkSmsTemplateExist(keyData)
                .then((response) => {
                  if (!response) {
                    reject('短信模板名称已存在');
                  } else {
                    resolve();
                  }
                })
                .catch((err) => {
                  reject(err.message || '验证失败');
                });
            });
          },
        },
      ];
    },
  },
  {
    field: 'templateId',
    label: '模板ID',
    component: 'Input',
  },
  {
    field: 'signName',
    label: '短信签名',
    component: 'Input',
  },
  {
    label: '短信状态',
    field: 'templateStatus',
    component: 'ApiRadioGroup',
    required: true,
    defaultValue: '1',
    componentProps: {
      api: listDictBusiness,
      params: 'ENABLE_OR_NOT',
      resultField: 'list',
      // use name as label
      labelField: 'dictName',
      // use id as value
      valueField: 'dictCode',
    },
  },
  {
    field: 'templateType',
    label: '短信类型',
    component: 'ApiSelect',
    defaultValue: '1',
    componentProps: {
      api: listDict,
      params: 'SMS_TEMPLATE_TYPE',
      labelField: 'dictName',
      valueField: 'dictCode',
    },
    required: true,
  },
  {
    label: '缓存有效期',
    field: 'cacheTimeOut',
    component: 'Input',
  },
  {
    label: '有效期单位',
    field: 'cacheTimeOutUnit',
    component: 'Input',
  },
  {
    label: '发送次数限制',
    field: 'sendTimesLimit',
    component: 'Input',
  },
  {
    label: '限制时间间隔',
    field: 'sendTimesLimitPeriod',
    component: 'Input',
  },
  {
    label: '备注',
    field: 'comments',
    component: 'InputTextArea',
  },
];
