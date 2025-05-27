export interface CategoryInterface {
    id: number;
    parentId?: number | null;
    name: string;
    description: string;
    image: string;
    subcategories?: number[];
    expanded?: boolean;
}
