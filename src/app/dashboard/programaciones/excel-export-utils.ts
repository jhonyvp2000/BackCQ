import ExcelJS from "exceljs";
import saveAs from "file-saver";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export async function exportDailyAgendaToExcel(surgeriesData: any[], displayDate: string) {
    const parsedDate = new Date(`${displayDate}T00:00:00`);
    const formattedDateStr = format(parsedDate, "dd/MM/yyyy");
    const formattedDateText = format(parsedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es });

    const activeSurgeries = surgeriesData.filter(s => s.surgery.status !== 'cancelled');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "BackCQ - Centro Quirúrgico";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Programación Diaria");

    // Configurar Ancho de Columnas
    worksheet.columns = [
        { key: "num", width: 6 },
        { key: "room", width: 16 },
        { key: "time", width: 12 },
        { key: "patient", width: 32 },
        { key: "doc", width: 16 },
        { key: "insurance", width: 12 },
        { key: "diagnosis", width: 36 },
        { key: "intervention", width: 38 },
        { key: "anesthesia", width: 14 },
        { key: "urgency", width: 14 },
        { key: "surgeon", width: 28 },
        { key: "anesthesiologist", width: 28 },
        { key: "nurses", width: 28 },
        { key: "status", width: 16 },
    ];

    // Fila 1: Título Institucional
    worksheet.mergeCells("A1:N1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "HOSPITAL II-2 TARAPOTO — PROGRAMACIÓN DIARIA DE CIRUGÍAS";
    titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A font" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(1).height = 32;

    // Fila 2: Subtítulo de Fecha
    worksheet.mergeCells("A2:N2");
    const subCell = worksheet.getCell("A2");
    subCell.value = `Jornada Quirúrgica: ${formattedDateText.toUpperCase()}`;
    subCell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FF1E293B" } };
    subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    subCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(2).height = 24;

    // Fila 3: Espacio en blanco
    worksheet.getRow(3).height = 10;

    // Fila 4: Cabeceras de Tabla
    const headers = [
        "N°", "Quirófano", "Hora", "Paciente", "DNI / HC", "Seguro", 
        "Diagnóstico CIE-10", "Intervención / Procedimiento", "Anestesia", 
        "Tipo", "Cirujano Principal", "Anestesiólogo", "Enfermería", "Estado"
    ];

    const headerRow = worksheet.getRow(4);
    headers.forEach((h, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = h;
        cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
            top: { style: "thin", color: { argb: "FF000000" } },
            left: { style: "thin", color: { argb: "FF000000" } },
            bottom: { style: "medium", color: { argb: "FF000000" } },
            right: { style: "thin", color: { argb: "FF000000" } }
        };
    });
    headerRow.height = 26;

    // Insertar datos de cirugías
    activeSurgeries.forEach((s, index) => {
        const rowNumber = 5 + index;
        const row = worksheet.getRow(rowNumber);

        const timeStr = s.surgery.scheduledDate 
            ? format(new Date(s.surgery.scheduledDate), "HH:mm") 
            : "--:--";

        const patientName = s.patientPii 
            ? `${s.patientPii.nombres} ${s.patientPii.apellidos}` 
            : "PACIENTE NO IDENTIFICADO";
        
        const patientDoc = s.patientPii?.dni || s.patientPii?.historiaClinica || 'S/DOC';

        const surgeons = s.team
            ? s.team.filter((t: any) => t.role === 'CIRUJANO_PRINCIPAL' || t.role === 'CIRUJANO')
                .map((t: any) => `${t.staff?.lastname || ''} ${t.staff?.name || ''}`).join(', ')
            : '-';

        const anesthesiologists = s.team
            ? s.team.filter((t: any) => t.role === 'ANESTESIOLOGO')
                .map((t: any) => `${t.staff?.lastname || ''} ${t.staff?.name || ''}`).join(', ')
            : '-';

        const nurses = s.team
            ? s.team.filter((t: any) => t.role === 'ENFERMERO' || t.role === 'INSTRUMENTISTA' || t.role === 'CIRCULANTE')
                .map((t: any) => `${t.staff?.lastname || ''} ${t.staff?.name || ''}`).join(', ')
            : '-';

        const interventionsText = s.interventionsList && s.interventionsList.length > 0
            ? s.interventionsList.map((i: any) => i.name).join(', ')
            : (s.proceduresList && s.proceduresList.length > 0 
                ? s.proceduresList.map((p: any) => p.name).join(', ') 
                : "Intervención Quirúrgica");

        const statusMap: Record<string, string> = {
            scheduled: "Programada",
            in_progress: "En Quirófano",
            anesthesia_start: "Anestesia",
            pre_incision: "Pre-Incisión",
            surgery_end: "Término Cirugía",
            patient_exit: "Salida Paciente",
            urpa_exit: "Salida URPA",
            completed: "Finalizada",
            completed_incomplete: "Finalizada (Incompleta)",
            cancelled: "Suspendida",
        };

        row.values = [
            index + 1,
            s.operatingRoom?.name || "Sin Sala",
            timeStr,
            patientName,
            patientDoc,
            s.surgery.insuranceType || "SIS",
            s.surgery.diagnosis || "Sin registro",
            interventionsText,
            s.surgery.anesthesiaType || "-",
            s.surgery.urgencyType || "ELECTIVO",
            surgeons,
            anesthesiologists,
            nurses,
            statusMap[s.surgery.status] || s.surgery.status
        ];

        // Estilos por celda
        row.eachCell((cell, colNumber) => {
            cell.font = { name: "Arial", size: 9 };
            cell.alignment = { vertical: "middle", wrapText: true };
            cell.border = {
                top: { style: "thin", color: { argb: "FFE2E8F0" } },
                left: { style: "thin", color: { argb: "FFE2E8F0" } },
                bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
                right: { style: "thin", color: { argb: "FFE2E8F0" } }
            };

            if (colNumber === 1 || colNumber === 3 || colNumber === 9 || colNumber === 10) {
                cell.alignment = { horizontal: "center", vertical: "middle" };
            }
        });

        row.height = 24;
    });

    // Generar Buffer y Descargar
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `Agenda_Quirurgica_${displayDate}.xlsx`;
    saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName);
}
