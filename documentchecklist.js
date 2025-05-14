import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import ApplicationFormId from '@salesforce/schema/ApplicationFormProduct.ApplicationFormId';
import getDocumentChecklistIems from '@salesforce/apex/DocumentChecklistHelper.getDocumentChecklistIems';
import updateDCIStatus from '@salesforce/apex/DocumentChecklistHelper.updateDCIStatus';

export default class DocumentChecklist extends LightningElement {
    @api recordId;
    isShowModal = false;
    documentChecklistItems = [];
    afProductDetails;
    checkListIndex;
    docChecklistResult;

    get title() {
        return 'Uploaded Documents';
    }

    get isShowError() {
        return this.documentChecklistItems.length === 0;
    }

    get files() {
        return this.documentChecklistItems[this.checkListIndex]?.ContentDocumentLinks || [];
    }

    get documentToupload() {
        return this.documentChecklistItems[this.checkListIndex] || {};
    }

    // Getter to extract ApplicationFormId from the record
    get applicationFormId() {
        return this.afProductDetails?.data ? getFieldValue(this.afProductDetails.data, ApplicationFormId) : null;
    }

    // Wire to get the Application Form Product record
    @wire(getRecord, { recordId: '$recordId', fields: [ApplicationFormId] })
    getApplicationFormProduct(result) {
        // console.log('getApplicationFormProduct:', JSON.stringify(result));

        this.afProductDetails = result;

        if (result.data) {
            // No need to assign result.data to documentChecklistItems here
            // Just trigger the second wire via applicationFormId
        } else if (result.error) {
            this.showErrorToast('Error', 'Something went wrong while loading Application Form Product');
            console.error('Error:', result.error);
        }
    }

    // Wire to get document checklist items using ApplicationFormId
    @wire(getDocumentChecklistIems, { parentRecordId: '$applicationFormId' })
    getDocumentChecklist(result) {
        // console.log('getDocumentChecklist:', JSON.stringify(result));
        this.docChecklistResult = result;

        if (result.data) {
            this.documentChecklistItems = result.data;
            this.prepareDocumentChecklistItems();
        } else if (result.error) {
            this.showErrorToast('Error', 'Something went wrong while loading document checklist items');
            console.error('Error:', result.error);
        }
    }

    async updateChecklistItemStatus() {
        try {
            await updateDCIStatus({
                docChecklistItemId: this.documentToupload.Id
            });
            await refreshApex(this.docChecklistResult);
            this.showSuccessTost('Success', 'Document status updated successfully');
        } catch (error) {
            console.log('Error:', error);
            this.showErrorTost('Error', 'Something went wrong');
        }
    }

    // Processing Methods
    prepareDocumentChecklistItems() {
        this.documentChecklistItems = this.documentChecklistItems.map((obj) => ({
            ...obj,
            isUploaded: obj.Status === 'Uploaded',
            isDisabled: obj.ContentDocumentLinks == null,
            ContentDocumentLinks: this.prepareContentVersions(obj.ContentDocumentLinks)
        }));
        // console.log('document Checklist: ' + JSON.stringify(this.documentChecklistItems));
    }
    prepareContentVersions(contentDocumentLinks) {
        if (contentDocumentLinks == null) {
            return null;
        }
        return contentDocumentLinks.map((cv) => ({
            ...cv,
            toUrl: '/' + cv.ContentDocumentId
        }));
    }

    // Handler Methods
    handleChecklistClick(event) {
        this.checkListIndex = event.target.dataset.index;
        this.showModalBox();
    }

    showModalBox() {
        this.isShowModal = true;
    }

    hideModalBox() {
        this.isShowModal = false;
    }

    handleUploadFinished(event) {
        let uploadedFiles = event.detail.files;
        this.checkListIndex = event.target.dataset.index;

        uploadedFiles.forEach((element) => {
            this.showSuccessTost('Success!', element.name + ` uploaded successfully.`);
        });
        // Update the DCI Status
        if (this.documentToupload.Status !== 'Uploaded') {
            this.updateChecklistItemStatus();
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }

    showSuccessTost(title, Message) {
        this.showToast(title, Message, 'success');
    }

    showErrorTost(title, Message) {
        this.showToast(title, Message, 'error');
    }

    showWarningTost(title, Message) {
        this.showToast(title, Message, 'warning');
    }

    showInfoTost(title, Message) {
        this.showToast(title, Message, 'info');
    }
}
