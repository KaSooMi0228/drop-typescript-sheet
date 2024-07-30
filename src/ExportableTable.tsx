import React from "react";
import * as XLSX from "xlsx";
import { useDefineExport } from "./app/project/embedded-records";
import { LocalDate } from "./clay/LocalDate";

export default function ExportableTable(props: {
    name: string;
    children: React.ReactNode;
}) {
    const ref = React.useRef<HTMLDivElement | null>(null);

    const onExport = React.useCallback(() => {
        const target = ref.current!;
        const data: any[][] = [];
        target.querySelectorAll("table").forEach((table) => {
            for (let index = 0; index < table.rows.length; index++) {
                const row = table.rows.item(index)!;
                const row_data = [];
                for (let col = 0; col < row.cells.length; col++) {
                    const cell = row.cells.item(col)!;
                    const input = cell.querySelector("input");
                    if (input) {
                        if (input.classList.contains("decimal-widget")) {
                            row_data.push(
                                parseFloat(input.value.replace(",", ""))
                            );
                        } else {
                            row_data.push(input.value);
                        }
                    } else {
                        row_data.push(row.cells.item(col)!.innerText);
                    }
                }
                data.push(row_data);
            }
        });
        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, sheet);

        XLSX.writeFile(
            workbook,
            `${new LocalDate(new Date()).toString()} - ${props.name}.xlsx`
        );
    }, [ref]);

    useDefineExport(onExport);

    return <div ref={ref}>{props.children}</div>;
}
