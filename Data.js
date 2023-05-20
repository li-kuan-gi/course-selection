// POST_DATA:  (Frontend to Backend)

//     login: account: String, password: String
    
//     select: account: String, courses: String (like "cid1=??&cid2=??&...")

//     cancel: account: String


// PAGE_DATA:  (Backend to Frontend)

//     Login Page:
//         stage: Number
//         loginURL: String

//     Result Page:
//         account: String
//         results: Array[result]  (result: {id: Number, name: String, credit: Number, fee: Number, stage: Number})
//         stage: Number (1 or 2)
//         cancelURL: String
//         logoutURL: String

//     Select Page:
//         account: String
//         states: Array[state]  (state: {id: Number, name: String, credit: Number, fee: Number, hasBeenSelected: Boolean, full: Boolean})
//             (only failed courses)
//         stage: Number (1 or 2)
//         selectURL: String
//         logoutURL: String

//     Invalid Account Page:
//         returnURL: String

//     SelectFail:
//         account: String
//         returnURL: String

//     NoWilling:
//         logoutURL: String