export type CreateUserInput = {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
    address?: {
      country: string;
      street: string;
      apartment?: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  