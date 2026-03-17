const PDFDocument = require('pdfkit');

/**
 * Generates a prescription PDF as a Buffer
 * @param {Object} data - The prescription data
 * @param {Object} data.doctor - Doctor details { name, specialization }
 * @param {Object} data.patient - Patient details { name, email }
 * @param {Array} data.medicines - List of medicines { name, dosage, frequency, duration }
 * @param {String} data.notes - Additional consultation notes
 * @param {Date} data.date - Appointment date
 * @returns {Promise<Buffer>} - Resolves with the PDF Buffer
 */
const generatePrescriptionPDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // --- Header ---
      doc.fontSize(20).text('Medical Prescription', { align: 'center' });
      doc.moveDown();

      // --- Doctor Info ---
      doc.fontSize(12).font('Helvetica-Bold').text(`Dr. ${data.doctor.name}`);
      if (data.doctor.specialization) {
        doc.fontSize(10).font('Helvetica').text(data.doctor.specialization);
      }
      doc.moveDown(0.5);

      // --- Line Separator ---
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      // --- Patient & Meta Info ---
      const metaY = doc.y;
      doc.fontSize(11).font('Helvetica-Bold').text('Patient Details:');
      doc.font('Helvetica').text(`Name: ${data.patient.name}`);
      doc.text(`Email: ${data.patient.email}`);

      doc.fontSize(11).font('Helvetica').text(`Date: ${new Date(data.date).toLocaleDateString()}`, { align: 'right' }, metaY);
      doc.moveDown();

      // --- Rx Line Separator ---
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // --- Medicines ---
      doc.fontSize(14).font('Helvetica-Bold').text('Rx', 50, doc.y);
      doc.moveDown(0.5);

      if (data.medicines && data.medicines.length > 0) {
        data.medicines.forEach((med, index) => {
          doc.fontSize(11).font('Helvetica-Bold').text(`${index + 1}. ${med.name}`);
          
          let instructions = [];
          if (med.dosage) instructions.push(`Dosage: ${med.dosage}`);
          if (med.frequency) instructions.push(`Freq: ${med.frequency}`);
          if (med.duration) instructions.push(`Duration: ${med.duration}`);
          
          if (instructions.length > 0) {
            doc.fontSize(10).font('Helvetica-Oblique').text(`   ${instructions.join(' | ')}`);
          }
          doc.moveDown(0.5);
        });
      } else {
        doc.fontSize(11).font('Helvetica-Oblique').text('No medicines prescribed.');
      }
      doc.moveDown();

      // --- Notes ---
      if (data.notes) {
        doc.fontSize(12).font('Helvetica-Bold').text('Consultation Notes:');
        doc.fontSize(10).font('Helvetica').text(data.notes);
        doc.moveDown();
      }

      // --- Footer ---
      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica-Oblique').text('This is a digitally generated prescription.', { align: 'center', color: 'grey' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generatePrescriptionPDF,
};
