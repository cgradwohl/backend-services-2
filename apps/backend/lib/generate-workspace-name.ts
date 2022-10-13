export interface IEmailInfo {
  isCompanyEmail: boolean;
  domain: string;
}

type GetCompanyNameFn = (
  email: string,
  emailInfo: IEmailInfo,
  tenantNames: string[]
) => string;

// Returns a generated workspace name based on the user email
const generateWorkspaceName: GetCompanyNameFn = (
  email: string,
  emailInfo: IEmailInfo,
  tenantNames: string[]
) => {
  // get the email username
  const emailName =
    email.charAt(0).toUpperCase() + email.substring(1, email.lastIndexOf("@"));

  // Check if this is the user's first tenant
  if (tenantNames?.length === 0) {
    // if email is company email, name it after their domain
    if (emailInfo.isCompanyEmail) {
      // If kickbox returns a domain, strip the TLD and return
      if (emailInfo.domain) {
        return emailInfo.domain.substring(0, emailInfo.domain.lastIndexOf("."));
      }
      // If kickbox doesn't return a domain, get it from the email
      const parsedDomain = email.substring(email.lastIndexOf("@") + 1);

      // capitalize the first letter of domain, strip the TLD and return
      return `${parsedDomain.charAt(0).toUpperCase()}${parsedDomain.substring(
        1,
        parsedDomain.lastIndexOf(".")
      )}`;
    }

    // if it's the first tenant, but email is free, name it after user
    return `${emailName}'s workspace`;
  }

  // If this isn't the users first tenant, find any tenants already named after the user
  const tenantsWithSameName = tenantNames?.filter((tenant) =>
    tenant?.includes(emailName)
  );

  // if no tenants are named after the user, return that name
  if (!tenantsWithSameName.length) {
    return `${emailName}'s workspace`;
  }

  // name workspace after user with an appended number if workspace name is a duplicate, return that name
  return `${emailName}${tenantsWithSameName.length + 1}'s workspace`;
};

export default generateWorkspaceName;
