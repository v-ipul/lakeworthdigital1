import { LightningElement, api } from 'lwc';
import invokeFlow from '@salesforce/apex/FileUploadController.invokeFlow';

export default class FileUploadComponent extends LightningElement {
    // To set the recordId where the files will be uploaded.
    @api recordId;

    // Define accepted file formats (optional)
    acceptedFormats = ['.pdf', '.jpg', '.png', '.docx', '.xlsx'];

    // Event handler for when the upload is finished
    handleUploadFinished(event) {
        const uploadedFiles = event.detail.files;
        const contentDocumentId = uploadedFiles[0].documentId;

        // Invoke Apex to start the flow with ContentDocumentId
        invokeFlow({ contentDocumentId })
            .then((result) => {
                console.log('Flow invoked successfully', result);
            })
            .catch((error) => {
                console.error('Error invoking flow', error);
            });
    }
}
