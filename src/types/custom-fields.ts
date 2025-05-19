export interface BaseCustomFieldOptions {
  name: string;
  plugin: string;
  type: string;
  input?: string;
}

export interface ExtendedCustomFieldServerOptions extends BaseCustomFieldOptions {
  intlLabel: {
    id: string;
    defaultMessage: string;
  };
  intlDescription: {
    id: string;
    defaultMessage: string;
  };
}