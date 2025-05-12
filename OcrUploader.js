import { LightningElement, api, track } from 'lwc';
import startOcrAsyncJob from '@salesforce/apex/OCRAsyncHandler.startOcrAsyncJob';

export default class OcrUploader extends LightningElement {
    @api parentRecordId; // Used if the OCR result is related to a specific record
    @track isLoading = false;

    // Trigger OCR process when file upload is finished
    handleUploadFinished(event) {
        this.isLoading = true;
        const uploadedFiles = event.detail.files;
        const documentId = uploadedFiles[0].documentId; // Get the contentDocumentId of the uploaded file

        // Start the OCR job asynchronously
        startOcrAsyncJob({ contentDocumentId: documentId })
            .then(() => {
                console.log('OCR process initiated.');
                this.isLoading = false;
            })
            .catch(error => {
                console.error('OCR failed:', error);
                this.isLoading = false;
            });
    }
}
