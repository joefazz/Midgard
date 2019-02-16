import { IExercise } from "../../models/exercise";

export const pythonExercises: IExercise[] = [
    {
        title: "Hello String",
        description: ` A string is how computers represent a word or sentence as data, the word string means a string of characters!\n\n They are used everywhere in programming and learning how to create, manipulate and arrange them is a fundamental skill to programming.`,
        task: "Create a string and print it out!",
        prebakedCode:
            "# In Python you create a variable by typing `name_of_variable = value_of_variable`"
    },
    {
        title: "String Extraction",
        description: ` As established, strings are just a chain of characters, this means they can be accessed using array notation.`,
        task:
            'Create a string with the value "Python is great" and print just the word "great"',
        expectedResult: "great"
    },
    {
        title: "String Math",
        description: ` In Python you can perform addition and multiplication on a string. Play around with both of these and figure out the function of each operator on a string.`,
        task:
            "Make two strings and try adding and multiplying them by different values."
    },
    {
        title: "Variables in Strings",
        description: ` If you've ever done a langugae like C then you're familiar with the way you can replace certain values in a string with calculated values, potentially from user input or just a function call that will return a value. You can perform this in python by using the % operator like so.\n\n "Hi my name is %s and I am %d years old" % ("Joe", 22). \n\n Alternatively you can use variables in strings by putting an f in front of the string and then surrounding the variable name with curly braces. For example: f'hello {name}'.`,
        task: "Get the users name and print it out using the % operator",
        requiredCode: "%",
        prebakedCode:
            '# You can get user input by calling `input("Your question here")`'
    },
    {
        title: "Back it up",
        description: ` Reversing a string is a common programming interview question and is a good test to see if you understand the ways that the string is represented in data form.`,
        task: ` Reverse the string "Python is great" (reverse by letters and try words if you're feeling brave)!`,
        expectedResult: `taerg si nohtyP`
    }
];
