import { CanDeactivateFn } from '@angular/router';

export interface HasUnsavedChanges {
    hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
    if (component.hasUnsavedChanges && component.hasUnsavedChanges()) {
        return confirm('You have unsaved attendance marks. Are you sure you want to leave this page? Unsaved changes will be lost.');
    }
    return true;
};
