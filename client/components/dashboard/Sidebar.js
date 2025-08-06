'use client';
import Image from 'next/image';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = ['Instructions', 'Users', 'Analytics', 'Actions'];

  return (
    <aside className="w-64 bg-[#161b22] p-6 flex-flex-col hidden md:flex">
      <div className="flex flex-col w-full">
        <div className="flex items-center gap-3 mb-10">
          <Image src="/logo.svg" alt="GPT Auth Logo" width={40} height={40} />
          <h1 className="text-xl font-bold">GPT Auth</h1>
        </div>
        <nav>
          <ul>
            {navItems.map((item) => (
              <li key={item} className="mb-2">
                <button
                  onClick={() => setActiveTab(item)}
                  className={`w-full text-left px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700 transition-colors ${
                    activeTab === item ? 'bg-blue-600 text-white' : ''
                  }`}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;