import { ReactNode, useState } from "react";
import { TiArrowSortedDown, TiArrowSortedUp, TiArrowUnsorted } from "react-icons/ti";

type Sort<T> = {
    key: keyof T;
    desc: boolean;
}

type TableProps<T> = {
    defaultSort: Sort<T>;
    columns: {
        text: string;
        key: keyof T;
    }[];
    data: T[];
    renderRow: (item: T) => ReactNode;
}

export default function Table<T>({ defaultSort, columns, data, renderRow }: TableProps<T>) {
    const [sort, setSort] = useState<Sort<T>>(defaultSort);

    return (
        <div className="text-text px-4 py-2 rounded-lg bg-tint grow">
            <table className="border-separate grow border-spacing-y-2">
                <thead className="text-left sticky top-0 bg-tint z-10">
                    <tr>
                        {columns.map(column => column &&
                            <th
                                className="cursor-pointer px-4 py-4"
                                key={column.text}
                                onClick={() => setSort({ key: column.key, desc: sort.key === column.key ? !sort.desc : true })}
                            >
                                {column.text}
                                {sort.key === column.key && (sort.desc
                                    ? <TiArrowSortedDown className="inline ml-1" />
                                    : <TiArrowSortedUp className="inline ml-1" />
                                )}
                                {sort.key !== column.key &&
                                    <TiArrowUnsorted className="inline ml-1"
                                />}
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {data.sort((a: T, b: T) => sort.desc !== (a[sort.key] > b[sort.key]) ? 1 : -1).map(renderRow)}
                </tbody>
            </table>
        </div>
    )
}