import ProceduralLoader from './ProceduralLoader';

const Loading = ({ fullScreen = true, message = 'Carregando...' }) => {
    if (!fullScreen) {
        return (
            <div className="flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        );
    }

    return <ProceduralLoader message={message} />;
};

export default Loading;
