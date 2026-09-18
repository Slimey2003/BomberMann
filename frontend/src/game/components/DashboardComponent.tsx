import MainMenuComponent from "./MenuComponent";

export default function DashboardComponent({
    setToastMessage
}: { 
    setToastMessage: (toast: { type: string; text: string; }) => void;
}) {
    return (
        <>
            <MainMenuComponent setToastMessage={setToastMessage}/>
        </>
    )
}