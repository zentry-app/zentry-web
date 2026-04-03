import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface StatementData {
    residencialName: string;
    houseAddress: string;
    periodo: string;
    saldoAnterior: number;
    cuotaMes: number;
    totalPagado: number;
    saldoActual: number;
    pagos: any[];
}

export class StatementPDFService {
    static generateHouseStatement(data: StatementData) {
        const doc = new jsPDF() as any;
        const pageWidth = doc.internal.pageSize.width;

        // Header
        doc.setFontSize(20);
        doc.setTextColor(41, 128, 185);
        doc.text('ESTADO DE CUENTA', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text(data.residencialName, pageWidth / 2, 28, { align: 'center' });

        // House Info
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Propiedad: ${data.houseAddress}`, 14, 45);
        doc.text(`Período: ${data.periodo}`, 14, 50);
        doc.text(`Fecha de Emisión: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 55);

        // Summary Box
        doc.setDrawColor(200);
        doc.setFillColor(245, 247, 250);
        doc.rect(14, 65, pageWidth - 28, 30, 'F');

        doc.setFontSize(10);
        doc.text('RESUMEN FINANCIERO', 20, 72);

        doc.setFontSize(9);
        doc.text(`Saldo Anterior: $${data.saldoAnterior.toFixed(2)}`, 20, 80);
        doc.text(`Cuota del Mes: $${data.cuotaMes.toFixed(2)}`, 20, 85);
        doc.text(`Total Pagado: $${data.totalPagado.toFixed(2)}`, pageWidth / 2, 80);

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(`SALDO TOTAL: $${data.saldoActual.toFixed(2)}`, pageWidth - 60, 88);
        doc.setFont(undefined, 'normal');

        // Payments Table
        doc.setFontSize(12);
        doc.text('DETALLE DE PAGOS', 14, 110);

        const tableHeaders = [['Fecha', 'Concepto', 'Referencia', 'Monto']];
        const tableData = data.pagos.map(p => [
            format(p.fecha instanceof Date ? p.fecha : p.fecha.toDate(), 'dd/MM/yyyy'),
            p.concepto,
            p.referencia || 'N/A',
            `$${p.amount.toFixed(2)}`
        ]);

        doc.autoTable({
            startY: 115,
            head: tableHeaders,
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 9 },
        });

        // Footer
        const finalY = (doc as any).lastAutoTable.cursor.y + 20;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Este documento es un comprobante informativo de los movimientos registrados en el sistema Zentry.', 14, finalY);
        doc.text('Para cualquier duda o aclaración, por favor contacte a la administración de su residencial.', 14, finalY + 5);

        // Save
        const fileName = `EstadoCuenta_${data.houseAddress.replace(/\s+/g, '_')}_${data.periodo}.pdf`;
        doc.save(fileName);
    }
}
