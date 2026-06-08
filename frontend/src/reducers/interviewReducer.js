export const initialFormState = {
    jobTitle: '',
    jobDescription: '',
    candidates: [],
    aiPrompt: '',
    startDate: '',
    startTime: '',
    expiryDate: '',
    expiryTime: '',
    duration: '60',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    difficulty: 'medium'
};

/**
 * Simple reducer to manage interview form state
 */
export const interviewReducer = (state, action) => {
    switch (action.type) {
        // Update a single field like 'jobTitle'
        case 'UPDATE_FIELD':
            return {
                ...state,
                [action.field]: action.value
            };

        // Update multiple fields at once (e.g., from an API response)
        case 'UPDATE_MULTIPLE':
            return {
                ...state,
                ...action.payload
            };

        // Special case for candidates list
        case 'SET_CANDIDATES':
            return {
                ...state,
                candidates: action.payload
            };

        // Reset the form to initial values
        case 'RESET_FORM':
            return initialFormState;

        // Set all data at once when starting an edit
        case 'SET_EDIT_DATA':
            return {
                ...initialFormState,
                ...action.payload
            };

        default:
            return state;
    }
};
