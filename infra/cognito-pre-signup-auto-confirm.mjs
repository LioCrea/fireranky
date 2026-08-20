export const handler = async (event) => {
  event.response.autoConfirmUser = true;
  if (event.request.userAttributes?.email) {
    event.response.autoVerifyEmail = true;
  }
  return event;
};
