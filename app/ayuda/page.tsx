import HelpSystem from '../../components/HelpSystem';

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center px-2 py-4">
      <div className="w-full max-w-md sm:max-w-2xl mx-auto px-2 sm:px-4 py-6">
        <HelpSystem />
      </div>
    </div>
  );
}