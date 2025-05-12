import { LightningElement, api } from 'lwc';
import startOcrAsyncJob from '@salesforce/apex/OCRAsyncHandler.startOcrAsyncJob';

export default class OcrUploader extends LightningElement {
    @api parentRecordId; // Used if you need to relate the OCR result to a record.

    // Trigger the OCR process when file upload is finished
    handleUploadFinished(event) {
        const uploadedFiles = event.detail.files;
        const documentId = uploadedFiles[0].documentId; // Get the contentDocumentId of the uploaded file

        startOcrAsyncJob({ contentDocumentId: documentId })
            .then(() => {
                console.log('OCR process initiated.');
            })
            .catch(error => {
                console.error('OCR failed:', error);
            });
    }
}
