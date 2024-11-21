import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import RENEWAL_RECORD_TYPE_ID from '@salesforce/schema/Opportunity.RecordTypeId';
import AMOUNT_FIELD from '@salesforce/schema/Opportunity.Amount';
import CLOSE_DATE_FIELD from '@salesforce/schema/Opportunity.CloseDate';

export default class OpportunityRenewalForm extends NavigationMixin(LightningElement) {
    @api recordId; // Current Opportunity Id
    @api opportunityId; // Opportunity ID passed from the flow or dynamically set
    amount = null; // Default to null for Amount
    renewalDate = null; // Default to null for Renewal Date
    renewalRecordTypeId;
    loaded = false; // Control when the form is displayed

    connectedCallback() {
        console.log('connectedCallback called');
        // Set the current Opportunity ID based on the Flow property or the record page
        this.opportunityId = this.opportunityId || this.recordId;

        // Dynamically fetch Renewal Record Type Id (if necessary)
        this.renewalRecordTypeId = RENEWAL_RECORD_TYPE_ID;
    }

    @wire(getRecord, {
        recordId: '$opportunityId',
        fields: [AMOUNT_FIELD, CLOSE_DATE_FIELD]
    })
    wiredOpportunity({ data, error }) {
        if (data) {
            console.log('Opportunity data loaded:', data);
            this.amount = data.fields.Amount.value || 0; // Default to 0 if Amount is null
            const closeDate = new Date(data.fields.CloseDate.value);
            closeDate.setFullYear(closeDate.getFullYear() + 1);
            this.renewalDate = closeDate.toISOString().split('T')[0]; // Prepopulate Renewal Date
            this.loaded = true; // Mark as loaded
        } else if (error) {
            this.showErrorToast('Error loading current Opportunity details');
        }
    }

    handleSuccess(event) {
        console.log('handleSuccess called:', event.detail.id);
        const newOpportunityId = event.detail.id;

        // Show success toast
        const toastEvent = new ShowToastEvent({
            title: 'Success',
            message: 'Renewal Opportunity successfully created!',
            variant: 'success'
        });
        this.dispatchEvent(toastEvent);

        // Navigate to the newly created Opportunity
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: newOpportunityId,
                objectApiName: 'Opportunity',
                actionName: 'view'
            }
        });
    }

    handleCancel() {
        console.log('handleCancel called');
        // Handle Cancel button: Close the flow or navigate back
        if (this.opportunityId) {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: this.opportunityId,
                    objectApiName: 'Opportunity',
                    actionName: 'view'
                }
            });
        } else {
            const closeEvent = new CustomEvent('close');
            this.dispatchEvent(closeEvent);
        }
    }

    showErrorToast(message) {
        const toastEvent = new ShowToastEvent({
            title: 'Error',
            message: message,
            variant: 'error'
        });
        this.dispatchEvent(toastEvent);
    }
}