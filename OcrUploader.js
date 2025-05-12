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
                // Poll or wait a bit before fetching the extracted text
                setTimeout(() => {
                    this.fetchText(documentId); // Fetch the extracted text after a short delay
                }, 5000); // Wait 5 seconds (adjust as necessary)
            })
            .catch(error => {
                console.error('OCR failed:', error);
                this.isLoading = false;
            });
    }

    // Fetch the extracted text from AWS Textract after OCR is done
    fetchText(contentDocumentId) {
        fetchExtractedText({ contentDocumentId })
            .then(result => {
                console.log('Fetched Extracted Text:', result); // Log the full result
                // Check if the result contains extracted text
                if (result && result.extractedText) {
                    this.extractedText = result.extractedText;
                } else {
                    console.log('No extracted text found!');
                }
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Failed to fetch extracted text:', error);
                this.isLoading = false;
            });
    }
}
