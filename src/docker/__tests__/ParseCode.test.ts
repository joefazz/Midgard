import { getCodeSaveCommand } from "../parse_code";

describe("Test Code Parsing Functions", () => {
    const MOCK_CODE = "let x = 7;console.log(x*x);";
    const MOCK_FILE = "testfile.js";

    test("Code save command", () => {
        expect(getCodeSaveCommand(MOCK_FILE, MOCK_CODE)).toMatchSnapshot();
    });
});
