import { LightningElement, api, track } from 'lwc';
import startOcrAsyncJob from '@salesforce/apex/OCRAsyncHandler.startOcrAsyncJob';
import fetchExtractedText from '@salesforce/apex/OCRAsyncHandler.fetchExtractedText';

export default class OcrUploader extends LightningElement {
    @api parentRecordId; // Optional, used for associating the file with a record
    @track isLoading = false;
    @track extractedText = ''; // This will store the extracted text

    // Trigger the OCR process when file upload is finished
    handleUploadFinished(event) {
        this.isLoading = true;
        const uploadedFiles = event.detail.files;
        const documentId = uploadedFiles[0].documentId;

        // Start the OCR job asynchronously
        startOcrAsyncJob({ contentDocumentId: documentId })
            .then(() => {
                console.log('OCR process initiated.');
                return this.fetchText(documentId);
            })
            .catch(error => {
                console.error('OCR failed:', error);
                this.isLoading = false;
            });
    }

    // Fetch the extracted text from AWS Textract after OCR is done
    fetchText(contentDocumentId) {
        return fetchExtractedText({ contentDocumentId })
            .then(result => {
                // Extract the text from the result and display it
                if (result && result.extractedText) {
                    this.extractedText = result.extractedText;
                }
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Failed to fetch extracted text:', error);
                this.isLoading = false;
            });
    }
}
