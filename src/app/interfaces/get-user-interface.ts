export interface GetUserInterface {
    id: number;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    userRole: number;
    favoriteProductIds: number[];
    createdAt: Date;
}
