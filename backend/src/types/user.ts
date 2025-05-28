export type CreateUserInput = {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
    username?: string;
    address?: {
      country: string;
      street: string;
      apartment?: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };