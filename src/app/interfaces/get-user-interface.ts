export interface GetUserInterface {
    id: number;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: number;
    favoriteProductIds: number[];
    createdAt: Date;
}
